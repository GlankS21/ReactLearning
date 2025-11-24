const {pool} = require('../config/database');

class User{
  static async findByLogin(login){
    try{
      const result = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
      return result.rows[0] || null;
    }
    catch(err){
      console.error(err);
      throw err;
    }
  }

  static async findByLoginAndPassword(login, password){
    try{
      const result = await pool.query('SELECT * FROM users WHERE login = $1 AND password = $2', [login, password]);
      return result.rows[0] || null;
    }
    catch(err){
      console.error(err);
      throw err;
    }
  }

  static async create(login, password){
    try{
      const result = await pool.query('INSERT INTO users(login, password, active) VALUES ($1, $2, NOW()) RETURNING login',[login, password])
      return result.rows[0];
    }
    catch(err){
      console.error(err);
      throw err;
    }
  }

  static generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  static async createToken(token, login) {
    try {
      await pool.query('INSERT INTO tokens (token, login, created) VALUES ($1, $2, NOW())',[token, login]);
    } 
    catch (error) {
      console.error('createToken error:', error);
      throw error;
    }
  }

  static async deleteExpiredTokens() {
    try {
      await pool.query("DELETE FROM tokens WHERE created < NOW() - INTERVAL '7 days'");
    } 
    catch (error) {
      console.error('deleteExpiredTokens error:', error);
      throw error;
    }
  }

  static async deleteToken(token) {
    try {
      const result = await pool.query('DELETE FROM tokens WHERE token = $1 RETURNING token',[token]);
      return result.rows.length > 0;
    } 
    catch (error) {
      console.error('deleteToken error:', error);
      throw error;
    }
  }

  static async verifyToken(token) {
    try {
      const result = await pool.query(
        `SELECT t.login FROM tokens t 
                JOIN users u ON t.login = u.login 
                WHERE t.token = $1 ORDER BY t.created DESC`, [token]
      );
      return result.rows[0] || null;
    } 
    catch (error) {
      console.error('verifyToken error:', error);
      throw error;
    }
  }
}

module.exports = User;