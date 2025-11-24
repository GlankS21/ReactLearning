const express = require('express');
const router = express.Router();
const roomController = require('../controllers/RoomController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/room/create:
 *   post:
 *     summary: Создание комнаты
 *     tags: [Room]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - player_amount
 *               - step_time
 *             properties:
 *               player_amount:
 *                 type: integer
 *                 enum: [2, 4]
 *                 example: 4
 *               step_time:
 *                 type: integer
 *                 enum: [15, 30, 45]
 *                 example: 30
 *     responses:
 *       201:
 *         description: Room created successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', (req, res) => {roomController.createRoom(req, res);});

/**
 * @swagger
 * /api/room/list:
 *   get:
 *     summary: Список комнат
 *     tags: [Room]
 *     responses:
 *       200:
 *         description: List of rooms
 *       500:
 *         description: Server error
 */
router.get('/list', (req, res) => { roomController.listRooms(req, res);});

/**
 * @swagger
 * /api/room/join:
 *   post:
 *     summary: Присоединиться к игровой комнате
 *     tags: [Room]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - game_id
 *             properties:
 *               token:
 *                 type: string
 *               game_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Joined room successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/join', authMiddleware, (req, res) => { roomController.joinRoom(req, res);});

/**
 * @swagger
 * /api/room/{game_id}/players:
 *   get:
 *     summary: Получить список игроков в игровой комнате
 *     tags: [Room]
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The game room ID
 *         example: 1
 *     responses:
 *       200:
 *         description: List of players retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     game_id:
 *                       type: integer
 *                     current_players:
 *                       type: integer
 *                     max_players:
 *                       type: integer
 *                     players:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           login:
 *                             type: string
 *                           color:
 *                             type: string
 *                           player_id:
 *                             type: integer
 */
router.get('/:game_id/players', (req, res) => { roomController.getRoomPlayers(req, res);});

/**
 * @swagger
 * /api/room/leave:
 *   post:
 *     summary: Покинуть игровую комнату
 *     description: Позволяет игроку покинуть комнату по логину. Если игрок покидает комнату, его запись и связанные с ним фигуры (лошади) удаляются из базы данных.
 *     tags: [Room]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_id
 *               - login
 *             properties:
 *               game_id:
 *                 type: integer
 *                 description: ID игровой комнаты, которую игрок хочет покинуть
 *                 example: 22
 *               login:
 *                 type: string
 *                 description: Логин игрока, который покидает комнату
 *                 example: "user"
 *     responses:
 *       200:
 *         description: Игрок успешно покинул комнату
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Player user123 left the room"
 *       400:
 *         description: Некорректные данные запроса (отсутствует game_id или login)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Missing game_id or login"
 *       404:
 *         description: Игрок не найден в указанной комнате
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Player not found in this room"
 *       500:
 *         description: Ошибка сервера при выходе из комнаты
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.post('/leave', (req, res) => { roomController.leaveRoom(req, res); });


module.exports = router;