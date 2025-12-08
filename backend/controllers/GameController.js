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
  const { horse_id } = req.body; // ✅ Chỉ cần horse_id
  const { login } = req.player;
  try {
    const result = await Game.moveHorse(horse_id, login); // ✅ Bỏ game_id
    if (!result.success) {
      return res.status(result.code).json({
        success: false,
        message: result.message,
      });
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
      return res.status(200).json({ success: true, message: 'Успешно вышел из игры', data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Не удалось выйти из игры', error: err.message });
    }
  }
}

module.exports = new GameController();