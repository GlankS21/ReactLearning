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
 * /api/game/start:
 *   post:
 *     summary: Начать игру, если достаточно игроков
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
 *               - game_id
 *             properties:
 *               game_id:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       200:
 *         description: Игра успешно начата
 *       400:
 *         description: Не хватает игроков или игра уже начата
 *       401:
 *         description: Требуется аутентификация
 *       403:
 *         description: Вы не в этой игре
 *       404:
 *         description: Игра не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.post('/start', authMiddleware, GameController.startGame);

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
 * /api/game/roll:
 *   post:
 *     summary: Бросить кубик (только в свой ход)
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
 *               - game_id
 *             properties:
 *               game_id:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       200:
 *         description: Результат броска кубика
 *       400:
 *         description: Кубик уже брошен или не ваш ход
 *       401:
 *         description: Требуется аутентификация
 *       404:
 *         description: Игроки не найдены
 *       500:
 *         description: Ошибка сервера
 */
router.post('/roll', authMiddleware, GameController.rollDice);

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
 *               - game_id
 *               - horse_id
 *             properties:
 *               game_id:
 *                 type: integer
 *                 example: 12
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
 *         description: Фишка или игра не найдены
 *       500:
 *         description: Ошибка сервера
 */
router.post('/move', authMiddleware, GameController.moveHorse);

/**
 * @swagger
 * /api/game/pass:
 *   post:
 *     summary: Пропустить ход (нет доступных ходов)
 *     description: |
 *       Пропустить текущий ход и передать его следующему игроку.
 *       Используется когда нет доступных фишек для движения или время истекло.
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
 *               - game_id
 *             properties:
 *               game_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ход успешно пропущен
 *       403:
 *         description: Не ваш ход
 *       404:
 *         description: Игра или игрок не найдены
 *       500:
 *         description: Ошибка сервера
 */
router.post('/pass', authMiddleware, GameController.passMove);

/**
 * @swagger
 * /api/game/{game_id}/winner:
 *   get:
 *     summary: Проверить, есть ли победитель
 *     tags: [Game]
 *     parameters:
 *       - name: game_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID игры
 *     responses:
 *       200:
 *         description: Результат проверки победителя
 *       404:
 *         description: Игра не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:game_id/winner', GameController.checkWinner);

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

module.exports = router;