const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { swaggerUi, specs } = require('./config/swagger'); 
const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// CORS configuration
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

// Khởi tạo database
initDatabase();

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
});