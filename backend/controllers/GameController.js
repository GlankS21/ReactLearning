const Game = require('../models/Game');

class GameController {
  async getGameState(req, res) {
    const { game_id } = req.params;
    try {
      const result = await Game.getGameState(game_id);
      if (!result.success) {
        return res.status(result.code).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
      if (result.data.winner && req.app.locals.handleGameWinner) {
        req.app.locals.handleGameWinner(game_id, result.data);
      }
      
      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Не удалось получить состояние игры', error: err.message });
    }
  }
  
  async moveHorse(req, res) {
    const { horse_id } = req.body;
    const { login } = req.player;
    try {
      const result = await Game.moveHorse(horse_id, login);
      if (!result.success) {
        return res.status(result.code).json({
          success: false,
          message: result.message,
        });
      }
      if (req.app.locals.broadcastGameState) {
        const horse = await Game.getHorse(horse_id);
        if (horse?.game_id) {
          req.app.locals.broadcastGameState(horse.game_id);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Лошадь успешно перемещена',
        data: result.data
      });
    } 
    catch (err) {
      console.error(err);
      return res.status(500).json({ 
        success: false, 
        message: 'Не удалось переместить лошадь', 
        error: err.message 
      });
    }
  }

  async leaveGame(req, res) {
    const { game_id } = req.params;
    const { login } = req.player;
    try {
      const result = await Game.leaveGame(game_id, login);
      if (req.app.locals.broadcastGameState) {
        req.app.locals.broadcastGameState(game_id);
      }
      
      return res.status(200).json({ success: true, message: 'Успешно вышел из игры', data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Не удалось выйти из игры', error: err.message });
    }
  }

  async passTurn(req, res) {
    const { game_id } = req.params;
    const { login } = req.player;
    try {
      const result = await Game.passTurn(game_id, login);
      
      if (req.app.locals.broadcastGameState) {
        req.app.locals.broadcastGameState(game_id);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Ход пропущен',
        data: result
      });
    } catch (err) {
      console.error('passTurn error:', err);
      return res.status(err.code || 500).json({ 
        success: false, 
        message: err.message || 'Не удалось пропустить ход'
      });
    }
  }
}

module.exports = new GameController();