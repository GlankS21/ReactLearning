const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();
const { swaggerUi, specs } = require('./config/swagger'); 
const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const gameRoutes = require('./routes/gameRoutes');
const Game = require('./models/Game');
const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean); 

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);    
    if (allowedOrigins.includes(origin)) callback(null, true);
    else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const ioOptions = {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);  
      if (allowedOrigins.includes(origin)) callback(null, true);
      else {
        console.warn(`[Socket.IO] Rejected origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
};

const io = socketIO(server, ioOptions);

io.on('connect_error', (error) => { console.error(`[SOCKET.IO_ERROR] Connection Error:`, error.message); });

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/game', gameRoutes);

const pendingGameDeletions = new Set();

io.on('connection', (socket) => {
  const gameId = socket.handshake.query.gameId;
  const roomId = socket.handshake.query.roomId;
  const login = socket.handshake.query.login;

  if (!gameId && !roomId) {
    socket.disconnect(true);
    return;
  }

  if (!login) {
    socket.disconnect(true);
    return;
  }
  if (roomId && !gameId) {
    const roomName = `room-${roomId}`;
    socket.join(roomName);
    console.log(`[SOCKET_CONNECTION] ${login} connected to room ${roomId}`);
    
    socket.on('disconnect', async () => {
      console.log(`[SOCKET_DISCONNECT] ${login} disconnected from room ${roomId}`);
      
      try {
        const roomStatus = await Room.getRoomStatus(roomId);
        if (roomStatus && roomStatus.status !== 'started') {
          await Room.removePlayer(roomId, login);
          console.log(`[ROOM_AUTO_LEAVE] ${login} left room ${roomId}`);
          
          io.to(roomName).emit('playerLeft', {
            login: login,
            message: `${login} покинул комнату`
          });
        } 
        else console.log(`[ROOM_SKIP_LEAVE] Game ${roomId} already started, skipping auto-leave for ${login}`);
      } 
      catch (err) {
        console.error(`[ROOM_AUTO_LEAVE] Error:`, err);
      }
    });

    socket.on('playerLeavingRoom', async (data) => {
      try {
        await Room.removePlayer(roomId, login);
        io.to(roomName).emit('playerLeft', {
          login: login,
          message: `${login} покинул комнату`
        });

        socket.leave(roomName);
        socket.disconnect();
      } 
      catch (err) {
        console.error(`[SOCKET_PLAYER_LEAVING_ROOM] Error:`, err);
      }
    });
  }

  if (gameId) {
    const roomName = `game-${gameId}`;
    socket.join(roomName);
    console.log(`[SOCKET_CONNECTION] ${login} connected to game ${gameId}`);
    
    socket.on('error', (error) => { console.error(`[SOCKET_ERROR] ${login} - Game ${gameId}:`, error);});
    socket.on('playerLeaving', async (data) => {
      try {
        await Game.leaveGame(gameId, login);

        io.to(roomName).emit('playerLeft', {
          login: login,
          message: `${login} left the game`
        });

        const gameState = await Game.getGameState(gameId);
        if (gameState.success) {
          io.to(roomName).emit('gameStateUpdate', gameState.data);
          if (gameState.data.winner) handleGameWinner(gameId, gameState.data);
        }

        socket.leave(roomName);
        socket.disconnect();
      } catch (err) {
        console.error(`[SOCKET_PLAYER_LEAVING] Error:`, err);
      }
    });
    socket.on('disconnect', async () => { console.log(`[SOCKET_DISCONNECT] ${login} socket disconnected from game ${gameId} - NOT removing from game (can rejoin)`);});
  }
});

app.post('/api/game/:game_id/leave', async (req, res) => {
  try {
    const { game_id } = req.params;
    const login = req.query.login || req.body.login;
    
    if (!login || !game_id) {
      return res.status(400).json({ error: 'Missing login or game_id' });
    }

    console.log(`[LEAVE_GAME_API] ${login} left game ${game_id}`);
    await Game.leaveGame(game_id, login);
    await broadcastGameState(game_id);
    
    res.json({ 
      success: true, 
      message: `Player ${login} left game ${game_id}`
    });
  } catch (err) {
    console.error(`[LEAVE_GAME_API] Error:`, err.message);
    res.status(500).json({ 
      error: 'Failed to leave game',
      message: err.message 
    });
  }
});

const handleGameWinner = async (gameId, gameState) => {
  if (pendingGameDeletions.has(gameId)) return;
  pendingGameDeletions.add(gameId);

  const roomName = `game-${gameId}`;
  const winner = gameState.winner;
  const winnerPlayer = gameState.players?.find(p => p.color === winner);

  console.log(`[GAME_WINNER] Game ${gameId} - Winner: ${winner} (${winnerPlayer?.login || 'unknown'})`);
  io.to(roomName).emit('game_ended', {
    winner: winner,
    winnerLogin: winnerPlayer?.login || null,
    message: `Game ended! Winner: ${winnerPlayer?.login || winner}`,
    redirectIn: 5
  });

  setTimeout(async () => {
    try {
      console.log(`[GAME_CLEANUP] Cleaning up game ${gameId}...`);
      await Game.deleteGame(gameId);
      io.to(roomName).emit('game_deleted', {
        gameId: gameId,
        message: 'Game has been deleted'
      });
      const sockets = await io.in(roomName).fetchSockets();
      for (const socket of sockets) {
        socket.leave(roomName);
        socket.disconnect(true);
      }

      console.log(`[GAME_CLEANUP] Game ${gameId} cleaned up, ${sockets.length} players disconnected`);
    } catch (err) {
      console.error(`[GAME_CLEANUP] Error cleaning up game ${gameId}:`, err);
    } finally {
      pendingGameDeletions.delete(gameId);
    }
  }, 5000);
};

const broadcastGameState = async (gameId) => {
  try {
    const gameState = await Game.getGameState(gameId);
    if (gameState.success) {
      io.to(`game-${gameId}`).emit('gameStateUpdate', gameState.data);
      if (gameState.data.winner) handleGameWinner(gameId, gameState.data);
    }
  } catch (err) {
    console.error('Broadcast game state error:', err);
  }
};

app.locals.broadcastGameState = broadcastGameState;
app.locals.handleGameWinner = handleGameWinner;

initDatabase();
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  console.log(`Socket.IO ready`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io, broadcastGameState, handleGameWinner };