const { pool } = require('../config/database');
const { LudoGameLogic: GameLogic, START_CELLS, HOME_RANGES, FINISH_CELLS } = require('../service/LudoGameLogic');

class Game {
  static async getGameById(game_id) {
    const { rows } = await pool.query('SELECT * FROM games WHERE game_id = $1', [game_id]);
    return rows[0] ?? null;
  }

  static async getPlayer(game_id, login) {
    const { rows } = await pool.query('SELECT * FROM player WHERE game_id = $1 AND login = $2', [game_id, login]);
    return rows[0] ?? null;
  }

  static async getHorse(horse_id, game_id) {
    const { rows } = await pool.query(`
      SELECT h.*, p.login, p.color FROM horses h
      JOIN player p ON h.player_id = p.player_id
      WHERE h.horse_id = $1 AND p.game_id = $2
    `, [horse_id, game_id]);
    return rows[0] ?? null;
  }

  static async getPendingDice(player_id) {
    const { rows } = await pool.query(`
      SELECT * FROM dice WHERE player_id = $1 AND roll_used = false LIMIT 1
    `, [player_id]);
    return rows[0] ?? null;
  }

  static async getAllPlayers(game_id) {
    const { rows } = await pool.query(
      'SELECT login, player_id, color, player_number FROM player WHERE game_id = $1 ORDER BY player_number', 
      [game_id]
    );
    return rows;
  }

  static async getAllHorses(game_id) {
    const { rows } = await pool.query(`
      SELECT h.*, p.color FROM horses h
      JOIN player p ON h.player_id = p.player_id
      WHERE p.game_id = $1
    `, [game_id]);
    return rows;
  }

  static async startGame(game_id, login) {
    const game = await this.getGameById(game_id);
    if (!game) return { success: false, code: 404, message: 'Game not found' };
    if (game.status === 'started') return { success: false, code: 400, message: 'Game already started' };

    const player = await this.getPlayer(game_id, login);
    if (!player) return { success: false, code: 403, message: 'Player not in game' };

    const players = await this.getAllPlayers(game_id);
    if (players.length < game.player_amount) {
      return { success: false, code: 400, message: `Not enough players: ${players.length}/${game.player_amount}` };
    }

    await pool.query(
      'UPDATE games SET status = $1, current_turn_player_login = $2 WHERE game_id = $3',
      ['started', players[0].login, game_id]
    );

    await pool.query('DELETE FROM dice WHERE player_id = ANY($1::int[])', [players.map(p => p.player_id)]);

    await pool.query(
      `INSERT INTO dice (player_id, number, roll_used, endtime) VALUES ($1, 0, true, NOW())`,
      [players[0].player_id]
    );

    return {
      success: true,
      code: 200,
      data: {
        game_id,
        players: players.map(p => ({ player_id: p.player_id, login: p.login, color: p.color })),
        current_turn_player_login: players[0].login
      }
    };
  }

  static async rollDice(game_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const game = await this.getGameById(game_id);
      if (!game) throw { code: 404, message: 'Game not found' };
      if (login !== game.current_turn_player_login) throw { code: 403, message: 'Not your turn' };

      const player = await this.getPlayer(game_id, login);
      if (!player) throw { code: 404, message: 'Player not found' };

      const pendingDice = await this.getPendingDice(player.player_id);
      if (pendingDice) throw { code: 400, message: 'Move horse first' };

      const roll = Math.floor(Math.random() * 6) + 1;
      await client.query('INSERT INTO dice (player_id, number, roll_used, endtime) VALUES ($1, $2, false, NULL)', 
        [player.player_id, roll]
      );

      await client.query('COMMIT');
      return {
        success: true,
        code: 200,
        data: { roll, player_login: login }
      };

    } catch (err) {
      await client.query('ROLLBACK');
      return { success: false, code: err.code || 500, message: err.message };
    } finally {
      client.release();
    }
  }

  static async getGameState(game_id) {
    try {
      const game = await this.getGameById(game_id);
      if (!game) return { success: false, code: 404, message: 'Game not found' };

      const players = await this.getAllPlayers(game_id);
      let remaining_time = game.step_time;
      
      if (game.current_turn_player_login) {
        const playerWithTurn = players.find(p => p.login === game.current_turn_player_login);
        if (playerWithTurn) {
          const dice = await pool.query(`
            SELECT endtime FROM dice 
            WHERE player_id = $1 AND number = 0 AND roll_used = true 
            ORDER BY endtime DESC LIMIT 1
          `, [playerWithTurn.player_id]);
          
          if (dice.rows[0]?.endtime) {
            const elapsed = Math.floor((Date.now() - new Date(dice.rows[0].endtime)) / 1000);
            remaining_time = Math.max(game.step_time - elapsed, 0);
          }
        }
      }

      const horsesRows = await this.getAllHorses(game_id);
      const horsesByPlayer = {};
      players.forEach(p => horsesByPlayer[p.player_id] = []);
      horsesRows.forEach(h => horsesByPlayer[h.player_id].push({ 
        horse_id: h.horse_id, 
        cell_number: h.cell_id ?? -1 
      }));

      return {
        success: true,
        code: 200,
        data: {
          game_id: game.game_id,
          status: game.status,
          current_turn_player_login: game.current_turn_player_login,
          step_time: game.step_time,
          players: players.map(p => ({
            player_id: p.player_id,
            login: p.login,
            color: p.color,
            is_turn: game.current_turn_player_login === p.login,
            remaining_time,
            horses: horsesByPlayer[p.player_id]
          }))
        }
      };
    } catch (err) {
      return { success: false, code: 500, message: 'Failed to get game state' };
    }
  }

  static async moveHorse(game_id, horse_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const game = await this.getGameById(game_id);
      if (!game) throw { code: 404, message: 'Game not found' };
      if (login !== game.current_turn_player_login) throw { code: 403, message: 'Not your turn' };

      const horse = await this.getHorse(horse_id, game_id);
      if (!horse) throw { code: 404, message: 'Horse not found' };

      const dice = await this.getPendingDice(horse.player_id);
      if (!dice) throw { code: 400, message: 'Roll dice first' };

      const diceRoll = dice.number;
      const currentCell = horse.cell_id ?? -1;
      
      let newCell;
      if (currentCell === -1) {
        newCell = START_CELLS[horse.color] + diceRoll;
      } else {
        newCell = GameLogic.moveHorse(currentCell, horse.color, diceRoll);
      }

      const home = HOME_RANGES[horse.color];
      if (currentCell >= home.start && newCell > home.end) {
        throw { code: 400, message: 'Cannot move beyond finish' };
      }

      if (newCell === currentCell && currentCell !== -1) {
        throw { code: 400, message: 'Invalid move' };
      }

      const allHorses = await this.getAllHorses(game_id);
      const captured = GameLogic.checkCapture(newCell, horse.color, allHorses);
      if (captured) await client.query('UPDATE horses SET cell_id = -1 WHERE horse_id = $1', [captured.horse_id]);

      await client.query('UPDATE horses SET cell_id = $1 WHERE horse_id = $2', [newCell, horse_id]);

      const finished = GameLogic.isFinished(newCell, horse.color);

      await client.query(
        'UPDATE dice SET roll_used = true, endtime = NOW() WHERE player_id = $1 AND roll_used = false', 
        [horse.player_id]
      );

      let nextTurnLogin = game.current_turn_player_login;
      if (diceRoll !== 6) {
        const playerLogins = (await this.getAllPlayers(game_id)).map(p => p.login);
        const idx = playerLogins.indexOf(game.current_turn_player_login);
        nextTurnLogin = playerLogins[(idx + 1) % playerLogins.length];
        await client.query('UPDATE games SET current_turn_player_login = $1 WHERE game_id = $2', 
          [nextTurnLogin, game_id]
        );
        
        const nextPlayer = await client.query(
          'SELECT player_id FROM player WHERE game_id = $1 AND login = $2',
          [game_id, nextTurnLogin]
        );
        if (nextPlayer.rows[0]) {
          await client.query('DELETE FROM dice WHERE player_id = $1', [nextPlayer.rows[0].player_id]);
          await client.query(
            `INSERT INTO dice (player_id, number, roll_used, endtime) VALUES ($1, 0, true, NOW())`,
            [nextPlayer.rows[0].player_id]
          );
        }
      }

      await client.query('COMMIT');
      return {
        success: true,
        code: 200,
        data: {
          from: currentCell,
          to: newCell,
          dice: diceRoll,
          captured: captured ? captured.horse_id : null,
          finished,
          canRollAgain: diceRoll === 6,
          nextTurnPlayerLogin: nextTurnLogin
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      return { success: false, code: err.code || 500, message: err.message };
    } finally {
      client.release();
    }
  }

  static async checkWinner(game_id) {
    const playerCount = await pool.query('SELECT COUNT(*) as count FROM player WHERE game_id = $1', [game_id]);
    
    if (parseInt(playerCount.rows[0].count) === 1) {
      const winner = await pool.query('SELECT color FROM player WHERE game_id = $1', [game_id]);
      return winner.rows[0] ? { winner: winner.rows[0].color } : { winner: null };
    }

    const horses = await pool.query(`
      SELECT h.cell_id, p.color FROM horses h
      JOIN player p ON h.player_id = p.player_id
      WHERE p.game_id = $1
    `, [game_id]);

    const winners = {};
    horses.rows.forEach(h => {
      if (!winners[h.color]) winners[h.color] = 0;
      if (h.cell_id === FINISH_CELLS[h.color]) winners[h.color]++;
    });

    const winnerColor = Object.entries(winners).find(([_, count]) => count === 4)?.[0] || null;
    return { winner: winnerColor };
  }

  static async leaveGame(game_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const player = await client.query(
        'SELECT player_id FROM player WHERE game_id = $1 AND login = $2',
        [game_id, login]
      );
      if (player.rows.length === 0) throw { code: 404, message: 'Player not found' };
      const player_id = player.rows[0].player_id;

      await client.query('DELETE FROM dice WHERE player_id = $1', [player_id]);
      await client.query('DELETE FROM horses WHERE player_id = $1', [player_id]);
      await client.query('DELETE FROM player WHERE player_id = $1', [player_id]);

      const remaining = await client.query('SELECT COUNT(*) as count FROM player WHERE game_id = $1', [game_id]);
      const remainingCount = parseInt(remaining.rows[0].count);

      if (remainingCount === 0) {
        await client.query('DELETE FROM cells WHERE game_id = $1', [game_id]);
        await client.query('DELETE FROM games WHERE game_id = $1', [game_id]);
      }

      await client.query('COMMIT');
      return { success: true, game_id, remaining_players: remainingCount };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async passMove(game_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
      
      const game = await this.getGameById(game_id);
      if (!game) throw { code: 404, message: 'Game not found' };
      if (login !== game.current_turn_player_login) throw { code: 403, message: 'Not your turn' };
      
      const player = await this.getPlayer(game_id, login);
      if (!player) throw { code: 404, message: 'Player not found' };

      await client.query('DELETE FROM dice WHERE player_id = $1 AND roll_used = false', [player.player_id]);

      const players = await client.query(
        'SELECT login, player_id FROM player WHERE game_id = $1 ORDER BY player_number',
        [game_id]
      );
      
      if (players.rows.length === 0) throw { code: 400, message: 'No players' };

      const idx = players.rows.findIndex(p => p.login === login);
      const nextPlayer = players.rows[(idx + 1) % players.rows.length];

      const updateResult = await client.query(
        `UPDATE games SET current_turn_player_login = $1 WHERE game_id = $2 AND current_turn_player_login = $3 RETURNING *`,
        [nextPlayer.login, game_id, login]
      );
      
      if (updateResult.rowCount === 0) throw { code: 409, message: 'Turn changed' };

      await client.query('DELETE FROM dice WHERE player_id = $1', [nextPlayer.player_id]);
      await client.query(
        `INSERT INTO dice (player_id, number, roll_used, endtime) VALUES ($1, 0, true, NOW())`,
        [nextPlayer.player_id]
      );

      await client.query('COMMIT');
      return { success: true, nextTurnPlayerLogin: nextPlayer.login };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = Game;