const { pool } = require('../config/database');
const { LudoGameLogic: GameLogic, START_CELLS, HOME_RANGES } = require('../service/LudoGameLogic');

class Game {
  static async getGameById(game_id) {
    const { rows } = await pool.query('SELECT * FROM games WHERE game_id = $1', [game_id]);
    return rows[0] ?? null;
  }

  static async getPlayer(game_id, login) {
    const { rows } = await pool.query('SELECT * FROM player WHERE game_id = $1 AND login = $2', [game_id, login]);
    return rows[0] ?? null;
  }

  static async getHorse(horse_id) {
    const { rows } = await pool.query(`
      SELECT h.*, p.login, p.color, p.game_id FROM horses h
      JOIN player p ON h.player_id = p.player_id
      WHERE h.horse_id = $1
    `, [horse_id]);
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

  static async getGameState(game_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const game = await this.getGameById(game_id);
      if (!game) {
        await client.query('ROLLBACK');
        return { success: false, code: 404, message: 'Game not found' };
      }

      const players = await this.getAllPlayers(game_id);

      let currentPlayer = null;
      let current_dice_number = null;
      let remaining_time = game.step_time;

      if (game.current_turn_player_login) {
        currentPlayer = players.find(p => p.login === game.current_turn_player_login);

        if (currentPlayer) {
          let pending = await this.getPendingDice(currentPlayer.player_id);

          if (!pending) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const endtime = new Date(Date.now() + game.step_time * 1000);
            await client.query(`
              INSERT INTO dice (player_id, number, roll_used, endtime)
              VALUES ($1, $2, false, $3)
            `, [currentPlayer.player_id, roll, endtime]);
            
            current_dice_number = roll;
            remaining_time = game.step_time;
          } else {
            const timeLeft = Math.floor((new Date(pending.endtime) - Date.now()) / 1000);

            if (timeLeft <= 0) {
              const playerLogins = players.map(p => p.login);
              const idx = playerLogins.indexOf(currentPlayer.login);
              const nextLogin = playerLogins[(idx + 1) % playerLogins.length];
              const nextPlayer = players.find(p => p.login === nextLogin);

              await client.query('UPDATE games SET current_turn_player_login = $1 WHERE game_id = $2', [nextLogin, game_id]);
              await client.query('DELETE FROM dice WHERE player_id = $1', [nextPlayer.player_id]);
              const roll = Math.floor(Math.random() * 6) + 1;
              const endtime = new Date(Date.now() + game.step_time * 1000);
              await client.query(`
                INSERT INTO dice (player_id, number, roll_used, endtime) VALUES ($1, $2, false, $3)
              `, [nextPlayer.player_id, roll, endtime]);

              currentPlayer = nextPlayer;
              current_dice_number = roll;
              remaining_time = game.step_time;
            } 
            else {  
              current_dice_number = pending.number;
              remaining_time = timeLeft;
            }
          }
        }
      }

      const horsesRows = await this.getAllHorses(game_id);
      const horsesByPlayer = {};
      players.forEach(p => horsesByPlayer[p.player_id] = []);
      horsesRows.forEach(h => { horsesByPlayer[h.player_id].push({ horse_id: h.horse_id, cell_number: h.cell_id ?? -1 });});

      let winner = null;
      const playerCount = parseInt((await client.query('SELECT COUNT(*) AS count FROM player WHERE game_id = $1', [game_id])).rows[0].count);
      if (playerCount === 1) {
        const winnerResult = await client.query('SELECT color FROM player WHERE game_id = $1', [game_id]);
        winner = winnerResult.rows[0]?.color || null;
      }
      else if (playerCount > 1) {
        const FINISH_CELLS = { red: 75, green: 57, yellow: 63, blue: 69 };
        const horsesQuery = await client.query(`
          SELECT h.cell_id, p.color FROM horses h 
          JOIN player p ON h.player_id = p.player_id WHERE p.game_id = $1
        `, [game_id]);

        const winners = {};
        horsesQuery.rows.forEach(h => {
          if (!winners[h.color]) winners[h.color] = 0;
          if (h.cell_id === FINISH_CELLS[h.color]) winners[h.color]++;
        });

        winner = Object.entries(winners).find(([color, count]) => count === 4)?.[0] || null;
      }

      await client.query('COMMIT');

      return {
        success: true,
        code: 200,
        data: {
          game_id: game.game_id,
          status: game.status,
          current_turn: currentPlayer?.login || null,
          remaining_time,
          step_time: game.step_time,
          dice: current_dice_number, 
          winner,
          players: players.map(p => ({
            player_id: p.player_id,
            login: p.login,
            color: p.color,
            player_number: p.player_number, 
            is_turn: currentPlayer?.login === p.login,
            horses: horsesByPlayer[p.player_id]
          }))
        }
      };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return { success: false, code: 500, message: 'Failed to get game state' };
    } finally {
      client.release();
    }
  }

  static async moveHorse(horse_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const horse = await this.getHorse(horse_id);
      if (!horse) throw { code: 404, message: 'Horse not found' };

      const game_id = horse.game_id;
      const game = await this.getGameById(game_id);
      if (!game) throw { code: 404, message: 'Game not found' };
      if (login !== game.current_turn_player_login)
        throw { code: 403, message: 'Not your turn' };

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
      if (currentCell >= home.start && newCell > home.end) throw { code: 400, message: 'Cannot move beyond finish' };
      if (newCell === currentCell && currentCell !== -1) throw { code: 400, message: 'Invalid move' };
      const allHorses = await this.getAllHorses(game_id);
      const captured = GameLogic.checkCapture(newCell, horse.color, allHorses);
      if (captured) await client.query(`UPDATE horses SET cell_id = -1 WHERE horse_id = $1`, [captured.horse_id]);
      await client.query( `UPDATE horses SET cell_id = $1 WHERE horse_id = $2`, [newCell, horse_id]);

      const finished = GameLogic.isFinished(newCell, horse.color);
      await client.query( `UPDATE dice SET roll_used = true, endtime = NOW()  WHERE player_id = $1 AND roll_used = false`, [horse.player_id]);

      let nextTurnLogin = game.current_turn_player_login;
      let canRollAgain = false;

      if (diceRoll === 6) {
        canRollAgain = true;
        await client.query(`DELETE FROM dice WHERE player_id = $1`, [horse.player_id]);
        const roll = Math.floor(Math.random() * 6) + 1;
        const endtime = new Date(Date.now() + game.step_time * 1000);
        await client.query(
          `INSERT INTO dice (player_id, number, roll_used, endtime)
          VALUES ($1, $2, false, $3)`,
          [horse.player_id, roll, endtime]
        );

        nextTurnLogin = login;
      } else {
        const players = (await this.getAllPlayers(game_id)).map((p) => p.login);
        const idx = players.indexOf(game.current_turn_player_login);
        nextTurnLogin = players[(idx + 1) % players.length];

        await client.query( `UPDATE games SET current_turn_player_login = $1 WHERE game_id = $2`, [nextTurnLogin, game_id]);
        const next = await client.query( `SELECT player_id FROM player WHERE game_id = $1 AND login = $2`, [game_id, nextTurnLogin]);

        if (next.rows[0]) {
          await client.query(`DELETE FROM dice WHERE player_id = $1`, [next.rows[0].player_id]);
        
          const roll = Math.floor(Math.random() * 6) + 1;
          const endtime = new Date(Date.now() + game.step_time * 1000);
          await client.query(
            `INSERT INTO dice (player_id, number, roll_used, endtime)
            VALUES ($1, $2, false, $3)`,
            [next.rows[0].player_id, roll, endtime]
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
          canRollAgain,
          nextTurn: nextTurnLogin,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      return { success: false, code: err.code || 500, message: err.message };
    } finally {
      client.release();
    }
  }

  static async leaveGame(game_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const game = await this.getGameById(game_id);
      if (!game) throw { code: 404, message: 'Game not found' };
      const player = await client.query(
        'SELECT player_id, player_number FROM player WHERE game_id = $1 AND login = $2',
        [game_id, login]
      );
      if (player.rows.length === 0) throw { code: 404, message: 'Player not found' };
      const player_id = player.rows[0].player_id;
      const player_number = player.rows[0].player_number;

      await client.query('DELETE FROM dice WHERE player_id = $1', [player_id]);
      await client.query('DELETE FROM horses WHERE player_id = $1', [player_id]);
      await client.query('DELETE FROM player WHERE player_id = $1', [player_id]);
      const remaining = await client.query('SELECT COUNT(*) as count FROM player WHERE game_id = $1', [game_id]);
      const remainingCount = parseInt(remaining.rows[0].count);

      if (remainingCount === 0) {
        await client.query('DELETE FROM cells WHERE game_id = $1', [game_id]);
        await client.query('DELETE FROM games WHERE game_id = $1', [game_id]);
        await client.query('COMMIT');
        return { success: true, game_id, remaining_players: 0 };
      }

      if (game.current_turn_player_login === login) {
        const allPlayers = await client.query(
          'SELECT login, player_number FROM player WHERE game_id = $1 ORDER BY player_number',
          [game_id]
        );
        
        const playerArray = allPlayers.rows;
        if (playerArray.length > 0) {
          let nextLogin = null;
          const nextPlayer = playerArray.find(p => p.player_number > player_number);
          
          if (nextPlayer) nextLogin = nextPlayer.login;
          else nextLogin = playerArray[0].login;
          await client.query(
            'UPDATE games SET current_turn_player_login = $1 WHERE game_id = $2', [nextLogin, game_id]
          );

          const nextPlayerData = await client.query(
            'SELECT player_id FROM player WHERE game_id = $1 AND login = $2', [game_id, nextLogin]
          );

          if (nextPlayerData.rows[0]) {
            await client.query('DELETE FROM dice WHERE player_id = $1', [nextPlayerData.rows[0].player_id]);
            const roll = Math.floor(Math.random() * 6) + 1;
            const endtime = new Date(Date.now() + game.step_time * 1000);
            await client.query(
              `INSERT INTO dice (player_id, number, roll_used, endtime)
              VALUES ($1, $2, false, $3)`,
              [nextPlayerData.rows[0].player_id, roll, endtime]
            );
          }
        }
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

  static async deleteGame(game_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const players = await client.query( 'SELECT player_id FROM player WHERE game_id = $1', [game_id]);
      const playerIds = players.rows.map(p => p.player_id);
      
      if (playerIds.length > 0) {
        await client.query(
          'DELETE FROM dice WHERE player_id = ANY($1)', [playerIds]
        );
        await client.query(
          'DELETE FROM horses WHERE player_id = ANY($1)', [playerIds]
        );
      }
      
      await client.query('DELETE FROM player WHERE game_id = $1', [game_id]);
      await client.query('DELETE FROM cells WHERE game_id = $1', [game_id]);
      await client.query('DELETE FROM games WHERE game_id = $1', [game_id]);
      
      await client.query('COMMIT');
      
      console.log(`[Game.deleteGame] Game ${game_id} deleted successfully`);
      return { success: true };
    } 
    catch (err) {
      await client.query('ROLLBACK');
      console.error(`[Game.deleteGame] Error:`, err);
      throw err;
    } 
    finally {
      client.release();
    }
  }
}

module.exports = Game;