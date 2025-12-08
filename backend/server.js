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
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL === '*' ? '*' : (process.env.CLIENT_URL || 'http://localhost:3000'),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connect_error', (error) => {
  console.error(`[SOCKET.IO_ERROR] Connection Error:`, error.message);
});

const corsOptions = {
  origin: process.env.CLIENT_URL === '*' ? '*' : (process.env.CLIENT_URL || 'http://localhost:3000'),
  credentials: process.env.CLIENT_URL !== '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/game', gameRoutes);

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

  if (gameId) {
    const roomName = `game-${gameId}`;
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
        }

        socket.leave(roomName);
        socket.disconnect();
      } catch (err) {
        console.error(`[SOCKET_PLAYER_LEAVING] Error:`, err);
      }
    });

    socket.on('tabClosing', async (data) => {
      try {
        await Game.leaveGame(gameId, login);
        
        io.to(roomName).emit('playerLeft', {
          login: login,
          message: `${login} left the game`
        });

        const gameState = await Game.getGameState(gameId);
        if (gameState.success) {
          io.to(roomName).emit('gameStateUpdate', gameState.data);
        }

        socket.leave(roomName);
      } catch (err) {
        console.error(`[SOCKET_TAB_CLOSING] Error:`, err);
      }
    });

    socket.on('disconnect', async () => {
      
      try {
        await Game.leaveGame(gameId, login);
        
        io.to(roomName).emit('playerLeft', {
          login: login,
          message: `${login} disconnected`
        });

        const gameState = await Game.getGameState(gameId);
        if (gameState.success) {
          io.to(roomName).emit('gameStateUpdate', gameState.data);
        }
        
      } catch (err) {
        console.error(`[SOCKET_DISCONNECT] Error:`, err);
      }
    });
  }
});

app.post('/api/game/:game_id/leave', async (req, res) => {
  try {
    const { game_id } = req.params;
    const login = req.query.login || req.body.login;
    
    if (!login || !game_id) {
      return res.status(400).json({ error: 'Missing login or game_id' });
    }
    await Game.leaveGame(game_id, login);
  
    await broadcastGameState(game_id);
    
    res.json({ 
      success: true, 
      message: `Player ${login} left game ${game_id}`
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to leave game',
      message: err.message 
    });
  }
});

const broadcastGameState = async (gameId) => {
  try {
    const gameState = await Game.getGameState(gameId);
    if (gameState.success) {
      io.to(`game-${gameId}`).emit('gameStateUpdate', gameState.data);
    }
  } catch (err) {
    console.error('Broadcast game state error:', err);
  }
};

app.locals.broadcastGameState = broadcastGameState;

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

module.exports = { app, io, broadcastGameState };