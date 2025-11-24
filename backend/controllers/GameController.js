const Game = require('../models/Game');

class GameController {
  async startGame(req, res) {
    const { game_id } = req.body;
    const { login } = req.player;
    try {
      const result = await Game.startGame(game_id, login);
      if (!result.success) {
        return res.status(result.code).json({
          success: false,
          message: result.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Игра началась успешно',
        data: result.data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ 
        success: false, 
        message: 'Не удалось начать игру' 
      });
    }
  }

  async rollDice(req, res) {
    const { game_id } = req.body;
    const { login } = req.player;
    try {
      const result = await Game.rollDice(game_id, login);
      if (!result.success) {
        return res.status(result.code).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Брошенные кости',
        data: result.data
      });

    } 
    catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Не удалось бросить кости', error: err.message });
    }
  }

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
    const { game_id, horse_id } = req.body;
    const { login } = req.player;
    try {
      const result = await Game.moveHorse(game_id, horse_id, login);
      if (!result.success) {
        return res.status(result.code).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Лошадь успешно перемещена',
        data: result.data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Не удалось переместить лошадь', error: err.message });
    }
  }

  async checkWinner(req, res) {
    const { game_id } = req.params;
    try {
      const result = await Game.checkWinner(game_id);
      return res.status(200).json({ success: true, data: result });
    } 
    catch (err) {
      return res.status(500).json({ success: false, message: 'Не удалось проверить победителя', error: err.message });
    }
  }

  async leaveGame(req, res) {
    const { game_id } = req.params;
    const { login } = req.player;
    try {
      const result = await Game.leaveGame(game_id, login);
      return res.status(200).json({ success: true, message: 'Успешно вышел из игры', data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Не удалось выйти из игры', error: err.message });
    }
  }

  async passMove(req, res) {
    const { game_id } = req.body;
    const { login } = req.player;
    try {
      const result = await Game.passMove(game_id, login);
      return res.status(200).json({
        success: true,
        message: 'Ход передается следующему игроку',
        data: result
      });
    } 
    catch (err) {
      return res.status(err.code || 500).json({
        success: false,
        message: err.message || 'Не удалось пройти ход',
        error: err.error || null
      });
    }
  }
}

module.exports = new GameController();