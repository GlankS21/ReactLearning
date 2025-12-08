const { pool } = require('../config/database');
const Room = require('../models/Room');

const VALID_PLAYER_AMOUNTS = [2, 4];
const VALID_STEP_TIMES = [15, 30, 45];
const COLOR_BY_NUMBER = ['green', 'yellow', 'blue', 'red'];

class RoomController {
  async createRoom(req, res) {
    let client;
    try {
      const { player_amount, step_time } = req.body;
      this._validateRoomInput(player_amount, step_time);
      client = await pool.connect();
      await client.query('BEGIN');
      const gameId = await this._insertGame(client, player_amount, step_time);
      await Room.createCells(client, gameId);
      await client.query('COMMIT');
      return res.status(201).json({
        success: true,
        message: 'Комната успешно создана',
        data: {
          game_id: gameId,
          player_amount,
          step_time
        },
      });
    } 
    catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Не удалось создать комнату',
        error: error.message
      });
    } 
    finally {
      if (client) client.release();
    }
  }

  async listRooms(req, res) {
    try {
      const games = await Room.findAll();
      const gamesWithPlayers = await Promise.all(games.map(async (game) => this._enrichGameWithPlayers(game)));

      return res.status(200).json({
        success: true,
        data: { games: gamesWithPlayers },
      });
    } 
    catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Не удалось составить список комнат',
      });
    }
  }

  async joinRoom(req, res) {
    let client;
    try {
      const { game_id } = req.body;
      const login = req.player.login;
      if (!game_id) {
        return res.status(400).json({
          success: false,
          message: 'Требуется ID игры',
        });
      }

      client = await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      const game = await client.query('SELECT player_amount, status FROM games WHERE game_id = $1', [game_id]);
      if (game.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Игра не найдена',
        });
      }

      const gameData = game.rows[0];
      if (gameData.status === 'started') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Игра уже началась, невозможно присоединиться',
        });
      }

      const hasPlayer = await client.query( 'SELECT player_id FROM player WHERE game_id = $1 AND login = $2', [game_id, login] );
      if (hasPlayer.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Игрок уже присоединился',
        });
      }
      const activeGame = await client.query( 'SELECT game_id FROM player WHERE login = $1 AND game_id != $2 LIMIT 1', [login, game_id]);
      if (activeGame.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Вы уже в игре №${activeGame.rows[0].game_id}. Покиньте ее, прежде чем присоединиться к новой`,
        });
      }

      const playersResult = await client.query( 'SELECT player_number FROM player WHERE game_id = $1 ORDER BY player_number', [game_id]);

      const currentPlayerCount = playersResult.rows.length;
      const maxPlayers = gameData.player_amount;

      if (currentPlayerCount >= maxPlayers) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Игра заполнена',
        });
      }

      let playerNumber = 1;
      for (let i = 0; i < maxPlayers; i++) {
        const occupied = playersResult.rows.some(p => p.player_number === i + 1);
        if (!occupied) {
          playerNumber = i + 1;
          break;
        }
      }

      const COLOR_BY_NUMBER = ['green', 'yellow', 'blue', 'red'];
      const color = COLOR_BY_NUMBER[playerNumber - 1];

      const playerRes = await client.query( `INSERT INTO player (game_id, login, color, player_number) VALUES ($1, $2, $3, $4) 
        RETURNING player_id`, [game_id, login, color, playerNumber]);

      const player_id = playerRes.rows[0].player_id;
      for (let i = 0; i < 4; i++) {
        await client.query( `INSERT INTO horses (player_id, cell_id) VALUES ($1, $2)`, [player_id, -1]);
      }

      const newPlayerCount = currentPlayerCount + 1; 

      let gameStarted = false;
      let firstPlayerRoll = null;

      if (newPlayerCount === maxPlayers) {
        const allPlayers = await client.query(
          'SELECT player_id, login, player_number FROM player WHERE game_id = $1 ORDER BY player_number', [game_id]
        );

        const firstPlayer = allPlayers.rows[0]; 
        await client.query(
          'UPDATE games SET status = $1, current_turn_player_login = $2 WHERE game_id = $3', ['started', firstPlayer.login, game_id]
        );
        const allPlayerIds = allPlayers.rows.map(p => p.player_id);
        await client.query('DELETE FROM dice WHERE player_id = ANY($1::int[])', [allPlayerIds]);
        firstPlayerRoll = Math.floor(Math.random() * 6) + 1;
        await client.query(
          'INSERT INTO dice (player_id, number, roll_used, endtime) VALUES ($1, $2, false, NULL)', [firstPlayer.player_id, firstPlayerRoll]
        );
        gameStarted = true;
      }

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Присоединились к комнате успешно',
        data: {
          login,
          color: color,
          max_players: maxPlayers,
          current_players: newPlayerCount,
          gameStarted: gameStarted, 
          firstPlayerRoll: firstPlayerRoll,
        },
      });
    } 
    catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (e) {}
      }
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Не удалось присоединиться к комнате',
        error: error.message,
      });
    }
    finally {
      if (client) client.release();
    }
  }

  async getRoomPlayers(req, res) {
    try {
      const { game_id } = req.params;
      if (!game_id) {
        return res.status(400).json({
          success: false,
          message: 'Требуется идентификатор игры',
        });
      }
      
      const game = await Room.findById(game_id);
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Игра не найдена',
        });
      }

      const players = await Room.getPlayers(game_id);
      const playerCount = await Room.countPlayers(game_id);

      return res.status(200).json({
        success: true,
        data: {
          game_id,
          current_players: playerCount,
          max_players: game.player_amount,
          step_time: game.step_time,
          status: game.status,
          players,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Не удалось получить игроков комнаты',
      });
    }
  }

  async leaveRoom(req, res) {
    try {
      const { game_id, login } = req.body;

      if (!game_id || !login) {
        return res.status(400).json({
          success: false,
          message: 'Требуется идентификатор игры и логин игрока',
        });
      }

      const game = await Room.findById(game_id);
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Игра не найдена',
        });
      }

      const hasPlayer = await Room.hasPlayer(game_id, login);
      if (!hasPlayer) {
        return res.status(404).json({
          success: false,
          message: 'Игрок не найден в этой комнате',
        });
      }

      await Room.removePlayer(game_id, login);

      return res.status(200).json({
        success: true,
        message: `Игрок ${login} покинул комнату`,
      });
    } 
    catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Не удалось покинуть комнату',
        error: error.message,
      });
    }
  }

  _validateRoomInput(player_amount, step_time) {
    if (!VALID_PLAYER_AMOUNTS.includes(player_amount)) {
      throw new Error('Количество игроков должно быть 2 или 4');
    }
    if (!VALID_STEP_TIMES.includes(step_time)) {
      throw new Error('Время шага должно быть 15, 30 или 45 секунд');
    }
  }

  async _insertGame(client, player_amount, step_time) {
    const gameResult = await client.query(
      'INSERT INTO games (player_amount, step_time) VALUES ($1, $2) RETURNING game_id', 
      [player_amount, step_time]
    );
    return gameResult.rows[0].game_id;
  }

  async _enrichGameWithPlayers(game) {
    const [playerCount, players] = await Promise.all([
      Room.countPlayers(game.game_id),
      Room.getPlayers(game.game_id)
    ]);

    return {
      game_id: game.game_id,
      player_amount: game.player_amount,
      step_time: game.step_time,
      status: game.status,
      current_players: playerCount,
      players,
    };
  }
}

module.exports = new RoomController();