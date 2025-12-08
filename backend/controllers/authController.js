const User = require('../models/User')

class AuthController{
  async signup(req, res){
    try{
      const {login, password} = req.body;
      // nếu không nhập đủ login + password
      if(!login || !password){
        return res.status(400).json({
          success: false,
          message: "Требуется логин и пароль",
        });
      }
      // nếu login đã tồn tại
      const existingUser = await User.findByLogin(login);
      if(existingUser){
        return res.status(400).json({
          success: false,
          message: "Логин уже существует",
        });
      }
      // tạo user
      const user = await User.create(login, password);
      const token = User.generateToken();
      await User.createToken(token, login);
      return res.status(201).json({
        success: true,
        message: "Пользователь создал",
        data: {login: user.login, token},
      });
    } 
    catch(err){
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async signin(req, res){
    try{
      const {login, password} = req.body;
      // nếu không nhập đủ login + password
      if(!login || !password){
        return res.status(400).json({
          success: false,
          message: "Требуется логин и парольd",
        });
      }
      await User.deleteExpiredTokens();
      // tìm login theo password
      const user = await User.findByLoginAndPassword(login, password);
      if(!user){
        return res.status(401).json({
          success: false,
          message: "Неверный логин или пароль",
        });
      }
      // tạo token mới
      const token = User.generateToken();
      await User.createToken(token, login);

      return res.status(200).json({
        success: true,
        message: "Вход успешный",
        data: {token, login},
      })
    }
    catch(err){
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async signout(req, res){
    try{
      const {token} = req.body;
      if(!token){
        return res.status(400).json({
          success: false,
          message: "Требуется токен",
        });
      }
      const deleted = await User.deleteToken(token);
      if(!deleted) {
        return res.status(400).json({
          success: false,
          message: "Недействительный токен",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Выход из системы успешен",
      });
    }
    catch(err){
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Server err",
      });
    }
  }
}
module.exports = new AuthController();