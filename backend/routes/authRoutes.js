const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Регистрация
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 example: user123
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Регистрация прошла успешно
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/signup', authController.signup.bind(authController));

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Логин
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 example: user
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Вход успешный
 *       401:
 *         description: Недействительные учетные данные
 *       500:
 *         description: Server error
 */
router.post('/signin', authController.signin.bind(authController));

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Выход
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Выход из системы успешен
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/signout', authController.signout.bind(authController));

module.exports = router;