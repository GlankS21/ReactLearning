const { pool } = require('../config/database');
const { LudoGameLogic: GameLogic, START_CELLS, HOME_RANGES} = require('../service/LudoGameLogic');

class Game {
  static async getGameById(game_id) {
    const { rows } = await pool.query('SELECT * FROM games WHERE game_id = $1', [game_id]); return rows[0] ?? null;
  }

  static async getPlayer(game_id, login) {
    const { rows } = await pool.query('SELECT * FROM player WHERE game_id = $1 AND login = $2', [game_id, login]); return rows[0] ?? null;
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
      SELECT * FROM dice WHERE player_id = $1 AND roll_used = false
      ORDER BY endtime DESC LIMIT 1
    `, [player_id]);
    return rows[0] ?? null;
  }

  static async getAllPlayers(game_id) {
    const { rows } = await pool.query(
      'SELECT login, player_id, color, player_number FROM player WHERE game_id = $1 ORDER BY player_number', [game_id]
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
    if (!game) return { success: false, code: 404, message: 'Игра не найдена' };
    if (game.status === 'started') return { success: false, code: 400, message: 'Игра уже началась' };

    const player = await this.getPlayer(game_id, login);
    if (!player) return { success: false, code: 403, message: 'Вас нет в этой игре' };

    const players = await this.getAllPlayers(game_id);
    if (players.length < game.player_amount) {
      return { success: false, code: 400, message: `Недостаточно игроков: ${players.length}/${game.player_amount}` };
    }

    await pool.query(
      'UPDATE games SET status = $1, current_turn_player_login = $2 WHERE game_id = $3',
      ['started', players[0].login, game_id]
    );

    // Clear dice
    await pool.query(
      'DELETE FROM dice WHERE player_id = ANY($1::int[])',
      [players.map(p => p.player_id)]
    );

    // 🔥 Tạo marker dice cho người chơi đầu tiên (start_time = NOW())
    const firstPlayer = players[0];
    await pool.query(
      `INSERT INTO dice (player_id, number, roll_used, endtime) 
       VALUES ($1, 0, true, NOW())`,
      [firstPlayer.player_id]
    );

    return {
      success: true,
      code: 200,
      data: {
        game_id,
        player_amount: game.player_amount,
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
      if (!game) throw { code: 404, message: 'Игра не найдена' };
      if (login !== game.current_turn_player_login) throw { code: 403, message: 'Не ваша очередь' };

      const player = await this.getPlayer(game_id, login);
      if (!player) throw { code: 404, message: 'Игрок не найден' };

      const pendingDice = await this.getPendingDice(player.player_id);
      if (pendingDice) throw { code: 400, message: 'Вы должны переместить лошадь, прежде чем снова кататься' };

      const roll = Math.floor(Math.random() * 6) + 1;
      await client.query('INSERT INTO dice (player_id, number, roll_used, endtime) VALUES ($1, $2, false, NULL)', [player.player_id, roll]
      );

      await client.query('COMMIT');
      return {
        success: true,
        code: 200,
        data: { roll, player_login: login, message: roll === 6 ? 'Вы выбросили 6! Бросьте еще раз после перемещения' : 'Двигайте лошадь' }
      };

    } catch (err) {
      await client.query('ROLLBACK');
      return { success: false, code: err.code || 500, message: err.message || 'Не удалось бросить кости' };
    } finally {
      client.release();
    }
  }

  static async getGameState(game_id) {
    try {
      const game = await this.getGameById(game_id);
      if (!game) return { success: false, code: 404, message: 'Игра не найдена' };

      const players = await this.getAllPlayers(game_id);
      let remaining_time = game.step_time;
      
      if (game.current_turn_player_login) {
        const playerWithTurn = players.find(p => p.login === game.current_turn_player_login);
        if (playerWithTurn) {
          // 🔥 Lấy marker dice (number = 0, roll_used = true) - đây là start_time
          const dice = await pool.query(`
            SELECT endtime FROM dice 
            WHERE player_id = $1 AND number = 0 AND roll_used = true 
            ORDER BY endtime DESC LIMIT 1
          `, [playerWithTurn.player_id]);
          
          if (dice.rows[0]?.endtime) {
            const startTime = new Date(dice.rows[0].endtime);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            remaining_time = Math.max(game.step_time - elapsed, 0);
          }
        }
      }

      const horsesRows = await this.getAllHorses(game_id);
      const horsesByPlayer = {};
      players.forEach(p => horsesByPlayer[p.player_id] = []);
      horsesRows.forEach(h => horsesByPlayer[h.player_id].push({ horse_id: h.horse_id, cell_number: h.cell_id ?? -1 }));

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
      return { success: false, code: 500, message: 'Не удалось получить состояние игры', error: err.message };
    }
  }

  // --- Move horse ---
  static async moveHorse(game_id, horse_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const game = await this.getGameById(game_id);
      if (!game) throw { code: 404, message: 'Игра не найдена' };
      if (login !== game.current_turn_player_login) throw { code: 403, message: 'Не твой очередь' };

      const horse = await this.getHorse(horse_id, game_id);
      if (!horse) throw { code: 404, message: 'Horse not found in this game' };

      const dice = await this.getPendingDice(horse.player_id);
      if (!dice) throw { code: 400, message: 'You must roll dice first' };

      const diceRoll = dice.number;
      const currentCell = horse.cell_id ?? -1;
      
      // 🔥 Calculate new cell
      let newCell;
      if (currentCell === -1) {
        newCell = START_CELLS[horse.color] + diceRoll;
      } else {
        newCell = GameLogic.moveHorse(currentCell, horse.color, diceRoll);
      }

     // Lấy home range theo màu
      const home = HOME_RANGES[horse.color];

      // Nếu ngựa đang trong vùng home
      if (currentCell >= home.start) {
        // và bước di chuyển vượt quá END
        if (newCell > home.end) {
          throw { code: 400, message: 'Ngựa không thể di chuyển quá vị trí kết thúc' };
        }
      }


      // 🔥 If horse didn't move (newCell === currentCell), it's invalid
      if (newCell === currentCell && currentCell !== -1) {
        throw { code: 400, message: 'Ngựa không thể di chuyển' };
      }

      // Capture
      const allHorses = await this.getAllHorses(game_id);
      const captured = GameLogic.checkCapture(newCell, horse.color, allHorses);
      if (captured) await client.query('UPDATE horses SET cell_id = -1 WHERE horse_id = $1', [captured.horse_id]);

      // Update horse
      await client.query('UPDATE horses SET cell_id = $1 WHERE horse_id = $2', [newCell, horse_id]);

      // Finish
      const finished = GameLogic.isFinished(newCell, horse.color);

      // 🔥 Mark dice used AND set endtime NOW (when move is made)
      const updateDice = await client.query(
        'UPDATE dice SET roll_used = true, endtime = NOW() WHERE player_id = $1 AND roll_used = false RETURNING *', 
        [horse.player_id]
      );
      if (updateDice.rowCount === 0) throw { code: 400, message: 'Кости не найдены после хода' };

      // Next turn
      let nextTurnLogin = game.current_turn_player_login;
      if (diceRoll !== 6) {
        const playerLogins = (await this.getAllPlayers(game_id)).map(p => p.login);
        const idx = playerLogins.indexOf(game.current_turn_player_login);
        nextTurnLogin = playerLogins[(idx + 1) % playerLogins.length];
        await client.query('UPDATE games SET current_turn_player_login = $1 WHERE game_id = $2', [nextTurnLogin, game_id]);
        
        // 🔥 Lấy next player
        const nextPlayer = await client.query(
          'SELECT player_id FROM player WHERE game_id = $1 AND login = $2',
          [game_id, nextTurnLogin]
        );
        if (nextPlayer.rows[0]) {
          // 🔥 Xóa dice cũ
          await client.query('DELETE FROM dice WHERE player_id = $1', [nextPlayer.rows[0].player_id]);
          
          await client.query(
            `INSERT INTO dice (player_id, number, roll_used, endtime) 
             VALUES ($1, 0, true, NOW())`,
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
          nextTurnPlayerLogin: nextTurnLogin,
          turnMessage: diceRoll === 6 ? 'Вы выбросили 6! Снова ваш ход' : 'Ход выполнен. Ход следующего игрока'
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      return { success: false, code: err.code || 500, message: err.message || 'Не удалось переместить лошадь', error: err.error };
    } finally {
      client.release();
    }
  }

  static async checkWinner(game_id) {
    const { rows: playerCountRows } = await pool.query(
      'SELECT COUNT(*) as count FROM player WHERE game_id = $1', [game_id]
    );
    const playerCount = parseInt(playerCountRows[0].count);

    if (playerCount === 1) {
      const { rows: winnerRows } = await pool.query(
        'SELECT login, color FROM player WHERE game_id = $1', [game_id]
      );
      if (winnerRows.length > 0) {
        return { winner: winnerRows[0].color, winner_login: winnerRows[0].login, reason: 'only_player_left' };
      }
    }

    const { rows: horses } = await pool.query(`
      SELECT h.cell_id, p.color
      FROM horses h
      JOIN player p ON h.player_id = p.player_id
      WHERE p.game_id = $1
    `, [game_id]);

    const winners = {};
    horses.forEach(h => {
      if (!winners[h.color]) winners[h.color] = 0;
      if (h.cell_id === 57) winners[h.color]++;
    });

    const winnerColor = Object.entries(winners).find(([_, count]) => count === 4)?.[0] || null;
    return { winner: winnerColor || null };
  }

  static async leaveGame(game_id, login) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: playerRows } = await client.query(
        'SELECT player_id FROM player WHERE game_id = $1 AND login = $2',
        [game_id, login]
      );
      if (playerRows.length === 0) throw { code: 404, message: 'Player not found' };
      const player_id = playerRows[0].player_id;

      await client.query('DELETE FROM dice WHERE player_id = $1', [player_id]);
      await client.query('DELETE FROM horses WHERE player_id = $1', [player_id]);
      await client.query('DELETE FROM player WHERE player_id = $1', [player_id]);

      const { rows: remainingRows } = await client.query(
        'SELECT COUNT(*) as count FROM player WHERE game_id = $1', [game_id]
      );
      const remainingCount = parseInt(remainingRows[0].count);

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
      
      // 🔥 Use transaction isolation level to prevent race conditions
      await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
      
      const game = await this.getGameById(game_id);
      if (!game) throw { code: 404, message: 'Game not found' };
      if (login !== game.current_turn_player_login) throw { code: 403, message: 'Not your turn' };
      
      const player = await this.getPlayer(game_id, login);
      if (!player) throw { code: 404, message: 'Player not found' };

      // 🔥 Xóa dice không sử dụng (roll_used = false)
      await client.query(
        `DELETE FROM dice WHERE player_id = $1 AND roll_used = false`,
        [player.player_id]
      );

      // Lấy danh sách người chơi
      const playersResult = await client.query(
        'SELECT login, player_id FROM player WHERE game_id = $1 ORDER BY player_number',
        [game_id]
      );
      const players = playersResult.rows;
      
      if (players.length === 0) throw { code: 400, message: 'No players in game' };

      const idx = players.findIndex(p => p.login === game.current_turn_player_login);
      if (idx === -1) throw { code: 400, message: 'Current player not found' };
      
      const nextPlayer = players[(idx + 1) % players.length];
      const nextTurnPlayerLogin = nextPlayer.login;

      // 🔥 Update current_turn_player_login và lock game row
      const updateResult = await client.query(
        `UPDATE games 
         SET current_turn_player_login = $1 
         WHERE game_id = $2 AND current_turn_player_login = $3
         RETURNING *`,
        [nextTurnPlayerLogin, game_id, login]
      );
      
      // 🔥 Verify update was successful (prevent race condition)
      if (updateResult.rowCount === 0) {
        throw { code: 409, message: 'Turn changed by another process, please refresh' };
      }

      // 🔥 Xóa dice cũ của người chơi tiếp theo
      await client.query('DELETE FROM dice WHERE player_id = $1', [nextPlayer.player_id]);

      // 🔥 Tạo marker dice mới với start_time = NOW()
      await client.query(
        `INSERT INTO dice (player_id, number, roll_used, endtime) 
         VALUES ($1, 0, true, NOW())`,
        [nextPlayer.player_id]
      );

      await client.query('COMMIT');

      return { 
        success: true,
        nextTurnPlayerLogin,
        message: `Turn passed to ${nextTurnPlayerLogin}`
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = Game;