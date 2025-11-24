const { Pool } = require('pg');
require('dotenv').config();

// const pool = new Pool({
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 5432,
//   database: process.env.DB_NAME || 'studs',
//   user: process.env.DB_USER || 's345124',
//   password: process.env.DB_PASSWORD,
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// })
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const initDatabase = async () => {
  try {
    // ENUM player_color
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_color') THEN
          CREATE TYPE player_color AS ENUM ('red', 'green', 'blue', 'yellow');
        END IF;
      END
      $$;
    `);
    // ENUM cells_type
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cells_type') THEN
          CREATE TYPE cells_type AS ENUM ('safe', 'insecure');
        END IF;
      END
      $$;
    `);

    // Table USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        login TEXT PRIMARY KEY,
        password TEXT,
        active TIMESTAMP
      );
    `);
    
    // Table TOKENS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT,
        login TEXT REFERENCES users(login) ON DELETE CASCADE,
        created TIMESTAMP
      );
    `);
    
    // Table GAMES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        game_id SERIAL PRIMARY KEY,
        step_time INTEGER,
        player_amount INTEGER,
        status TEXT DEFAULT 'waiting',
        current_turn_player_login TEXT NULL
      );
    `);
    
    // Table PLAYER
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player (
        player_id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
        login VARCHAR(30) NOT NULL REFERENCES users(login) ON DELETE CASCADE,
        player_number INTEGER,
        color player_color
      );
    `);
    
    // Table DICE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dice (
        player_id INTEGER NOT NULL REFERENCES player(player_id) ON DELETE CASCADE,
        number SMALLINT,
        endtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        roll_used BOOLEAN DEFAULT FALSE
      );
    `);
    
    // Table HORSES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS horses (
        horse_id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES player(player_id) ON DELETE CASCADE,
        cell_id INTEGER
      );
    `);
    
    // Table CELLS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cells (
        cell_id SERIAL PRIMARY KEY,
        cell_number INTEGER,
        game_id INTEGER NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
        type cells_type
      );
    `);
    
    console.log('Database tables and types initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initDatabase,
};