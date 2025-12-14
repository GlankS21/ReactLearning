import axiosClient from './axiosClient';

const gameAPI = {
  getGameState: (game_id) => axiosClient.get(`/game/${game_id}`),

  moveHorse: (horse_id) => axiosClient.post('/game/move', { horse_id }),

  leaveGame: (game_id, login) => axiosClient.post(`/game/${game_id}/leave`, { login }),
  
  passTurn: (game_id) => axiosClient.post(`/game/${game_id}/pass-turn`),
};

export default gameAPI;