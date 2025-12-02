import axiosClient from './axiosClient';

const roomAPI = {
    createRoom: (player_amount, step_time) => axiosClient.post('/room/create', { player_amount, step_time }),

    listRooms: () => axiosClient.get('/room/list'),

    joinRoom: (game_id) => axiosClient.post('/room/join', { game_id }),

    getRoomPlayers: (game_id) => axiosClient.get(`/room/${game_id}/players`),

    leaveRoom: (game_id, login) => axiosClient.post('/room/leave', { game_id, login }),
};

export default roomAPI;