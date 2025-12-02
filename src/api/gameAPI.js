import axiosClient from './axiosClient';

const gameAPI = {
    startGame: (game_id) => axiosClient.post('/game/start', { game_id }),

    getGameState: (game_id) => axiosClient.get(`/game/${game_id}`),

    rollDice: (game_id) => axiosClient.post('/game/roll', { game_id }),

    moveHorse: (game_id, horse_id) => axiosClient.post('/game/move', { game_id, horse_id }),

    passMove: (game_id) => axiosClient.post('/game/pass', { game_id }),

    // checkWinner: (game_id) => axiosClient.get(`/game/${game_id}/winner`),

    leaveGame: (game_id) => axiosClient.post(`/game/${game_id}/leave`),
};

export default gameAPI;