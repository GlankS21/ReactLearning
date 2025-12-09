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
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[Socket.IO] Rejected origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
};

const io = socketIO(server, ioOptions);

io.on('connect_error', (error) => {
  console.error(`[SOCKET.IO_ERROR] Connection Error:`, error.message);
});

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
    socket.join(roomName);
    console.log(`[SOCKET_CONNECTION] ${login} connected to game ${gameId}`);
    socket.on('error', (error) => {
      console.error(`[SOCKET_ERROR] ${login} - Game ${gameId}:`, error);
    });
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

    socket.on('disconnect', () => {
      console.log(`[SOCKET_DISCONNECT] ${login} socket disconnected from game ${gameId}`);
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

    console.log(`[LEAVE_GAME_API] ${login} left game ${game_id}`);
    await Game.leaveGame(game_id, login);
    
    // Broadcast cập nhật game state
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

// ============================================
// Broadcast game state helper
// ============================================
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

// ============================================
// Database initialization
// ============================================
initDatabase();

// ============================================
// Server startup
// ============================================
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

// ============================================
// Graceful shutdown
// ============================================
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io, broadcastGameState };