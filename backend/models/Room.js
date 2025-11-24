const { pool } = require('../config/database');

const HOME_RANGES = {
  red: { start: 52, end: 57 },
  blue: { start: 58, end: 63 },
  yellow: { start: 64, end: 69 },
  green: { start: 70, end: 75 },
};

const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];
const MAIN_BOARD_CELLS = 52;
const HORSES_PER_PLAYER = 4;

class Room {
  static async findById(gameId) {
    try {
      const result = await pool.query(
        'SELECT * FROM games WHERE game_id = $1', [gameId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const result = await pool.query(
        'SELECT * FROM games ORDER BY game_id DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Room.findAll error:', error);
      throw error;
    }
  }

  static async createCells(client, gameId) {
    try {
      await this._createMainBoardCells(client, gameId);
      await this._createHomeRangeCells(client, gameId);

      console.log(`Cells for game ${gameId} created successfully.`);
    } catch (error) {
      console.error('Room.createCells error:', error);
      throw error;
    }
  }

  static async countPlayers(gameId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM player WHERE game_id = $1',
        [gameId]
      );
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Room.countPlayers error:', error);
      throw error;
    }
  }

  static async hasPlayer(gameId, login) {
    try {
      const result = await pool.query(
        'SELECT EXISTS(SELECT 1 FROM player WHERE game_id = $1 AND login = $2)',
        [gameId, login]
      );
      return result.rows[0].exists;
    } catch (error) {
      console.error('Room.hasPlayer error:', error);
      throw error;
    }
  }

  static async getPlayers(gameId) {
    try {
      const result = await pool.query(
        'SELECT login, color, player_id FROM player WHERE game_id = $1 ORDER BY player_number',
        [gameId]
      );
      return result.rows;
    } catch (error) {
      console.error('Room.getPlayers error:', error);
      throw error;
    }
  }

  static async getUsedColors(gameId) {
    try {
      const result = await pool.query(
        'SELECT color FROM player WHERE game_id = $1', [gameId]
      );
      return result.rows.map(r => r.color);
    } catch (error) {
      console.error('Room.getUsedColors error:', error);
      throw error;
    }
  }

  static async findGameByPlayer(login) {
    const query = `
      SELECT g.game_id, g.status
      FROM games g
      JOIN player p ON p.game_id = g.game_id
      WHERE p.login = $1
    `;
    const result = await pool.query(query, [login]);
    return result.rows[0] || null;
  }

  static async addPlayer(gameId, login, playerNumber, color) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const playerId = await this._insertPlayer(client, gameId, login, playerNumber, color);
      await this._createPlayerHorses(client, playerId);

      await client.query('COMMIT');
      return playerId;
    } 
    catch (error) {
      await client.query('ROLLBACK');
      console.error('Room.addPlayer error:', error);
      throw error;
    } 
    finally {
      client.release();
    }
  }

  static async removePlayer(gameId, login) {
    try {
      await pool.query('DELETE FROM dice WHERE player_id IN (SELECT player_id FROM player WHERE login = $1)',[login]);
      await pool.query('DELETE FROM horses WHERE player_id IN (SELECT player_id FROM player WHERE login = $1)', [login]);
      await pool.query('DELETE FROM player WHERE game_id = $1 AND login = $2', [gameId, login]);
      const players = await this.getPlayers(gameId);
      if(players.length === 0){
        await pool.query('DELETE FROM cells WHERE game_id = $1', [gameId]);
        await pool.query('DELETE FROM games WHERE game_id = $1', [gameId])
      }
    } 
    catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async _createMainBoardCells(client, gameId) {
    for (let i = 0; i < MAIN_BOARD_CELLS; i++) {
      const type = SAFE_CELLS.includes(i) ? 'safe' : 'insecure';
      await client.query(
        'INSERT INTO cells (game_id, cell_number, type) VALUES ($1, $2, $3)',
        [gameId, i, type]
      );
    }
  }

  static async _createHomeRangeCells(client, gameId) {
    for (const color in HOME_RANGES) {
      const range = HOME_RANGES[color];
      for (let i = range.start; i <= range.end; i++) {
        const type = SAFE_CELLS.includes(i) ? 'safe' : 'insecure';
        await client.query(
          'INSERT INTO cells (game_id, cell_number, type) VALUES ($1, $2, $3)',
          [gameId, i, type]
        );
      }
    }
  }

  static async _insertPlayer(client, gameId, login, playerNumber, color) {
    const result = await client.query(
      'INSERT INTO player (game_id, login, player_number, color) VALUES ($1, $2, $3, $4) RETURNING player_id',
      [gameId, login, playerNumber, color]
    );
    return result.rows[0].player_id;
  }

  static async _createPlayerHorses(client, playerId) {
    for (let i = 0; i < HORSES_PER_PLAYER; i++) {
      await client.query(
        'INSERT INTO horses (player_id, cell_id) VALUES ($1, NULL)',
        [playerId]
      );
    }
  }
}

module.exports = Room;