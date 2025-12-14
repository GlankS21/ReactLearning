// backend/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const GameController = require('../controllers/GameController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Game
 *   description: API управления игровым процессом Ludo
 */

/**
 * @swagger
 * /api/game/{game_id}:
 *   get:
 *     summary: Получить текущее состояние игры
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: game_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID игры
 *     responses:
 *       200:
 *         description: Текущее состояние игры
 *       401:
 *         description: Требуется аутентификация
 *       404:
 *         description: Игра не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:game_id', authMiddleware, GameController.getGameState);

/**
 * @swagger
 * /api/game/move:
 *   post:
 *     summary: Двигать фишку
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - horse_id
 *             properties:
 *               horse_id:
 *                 type: integer
 *                 example: 79
 *     responses:
 *       200:
 *         description: Фишка успешно перемещена
 *       400:
 *         description: Неверный ход
 *       401:
 *         description: Требуется аутентификация
 *       403:
 *         description: Не ваш ход или не ваша фишка
 *       404:
 *         description: Фишка не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.post('/move', authMiddleware, GameController.moveHorse);
/**
 * @swagger
 * /api/game/{game_id}/leave:
 *   post:
 *     summary: Покинуть игру
 *     description: |
 *       Игрок покидает игру и удаляется из комнаты.
 *       Если остается только 1 игрок - он автоматически побеждает.
 *       Если игроков не осталось - игра удаляется.
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: game_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Игрок успешно покинул игру
 *       401:
 *         description: Требуется аутентификация
 *       404:
 *         description: Игрок не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post('/:game_id/leave', authMiddleware, GameController.leaveGame);

/**
 * @swagger
 * /api/game/{game_id}/pass-turn:
 *   post:
 *     summary: Pass turn to next player
 *     description: Pass turn when no valid moves are available. Login is automatically determined from auth token.
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Turn passed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     nextTurn:
 *                       type: string
 *                       description: Login of the next player
 *                     dice:
 *                       type: integer
 *                       description: Dice roll for the next player
 *       403:
 *         description: Not your turn
 *       404:
 *         description: Game or player not found
 *       500:
 *         description: Server error
 */
router.post('/:game_id/pass-turn', authMiddleware, GameController.passTurn);

module.exports = router;