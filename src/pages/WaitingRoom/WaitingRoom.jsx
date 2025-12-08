import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import roomAPI from "../../api/roomAPI";
import * as style from "./style";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent";

const WaitingRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const playerFilter = parseInt(searchParams.get("players")) || 4;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPlayers, setNumPlayers] = useState("4");
  const [timePerMove, setTimePerMove] = useState("30");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef(null);

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.listRooms();
      if (response.success && Array.isArray(response.data?.games)) {
        setRooms(response.data.games);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    intervalRef.current = setInterval(fetchRooms, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleJoinRoom = async (roomId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Please sign in first");
        navigate("/SignIn");
        return;
      }

      const response = await roomAPI.joinRoom(roomId);

      if (response.success) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        navigate(`/room?gameId=${roomId}`);
      } else {
        alert(response.message || "Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Cannot connect to server");
    }
  };

  const handleSubmitNewGame = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Please sign in first");
        navigate("/SignIn");
        return;
      }

      const response = await roomAPI.createRoom(parseInt(numPlayers), parseInt(timePerMove));

      if (response.success) {
        const gameId = response.data.game_id;
        handleCloseModal();
        if (intervalRef.current) clearInterval(intervalRef.current);
        await handleJoinRoom(gameId);
      } else {
        alert(response.message || "Failed to create game");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Cannot connect to server");
    }
  };

  const handleBack = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    navigate("/ludohome");
  };

  const handleCreateGame = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNumPlayers("4");
    setTimePerMove("30");
  };

  if (loading) {
    return (
      <BackgroundComponent opacity={0.95}>
        <style.WrapperContainer>
          <style.WrapperTitle>Loading...</style.WrapperTitle>
        </style.WrapperContainer>
      </BackgroundComponent>
    );
  }

  const filteredRooms = rooms.filter(room => room.player_amount === playerFilter);

  return (
    <BackgroundComponent opacity={0.95}>
      <style.WrapperContainer>
        <style.WrapperBackButton onClick={handleBack}>←</style.WrapperBackButton>
        <style.WrapperTitle>ТУРНИР</style.WrapperTitle>
        <style.WrapperCreateButton onClick={handleCreateGame}>+ Создать игру</style.WrapperCreateButton>

        <style.WrapperRoomsGrid>
          {filteredRooms.length === 0 ? (
            <div style={{ color: "white", gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>
              Нет доступных комнат. Создайте!
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isGameStarted = room.status === 'started';
              const isFull = room.current_players >= room.player_amount;
              const canJoin = !isGameStarted && !isFull;

              return (
                <style.WrapperRoomCard key={room.game_id} style={{ opacity: isGameStarted ? 0.6 : 1 }}>
                  <style.WrapperRoomHeader>
                    <span>Комната {room.game_id}</span>
                    <style.WrapperRoomTime>{room.step_time}s</style.WrapperRoomTime>
                  </style.WrapperRoomHeader>

                  <style.WrapperPlayersGrid>
                    {Array.from({ length: room.player_amount }).map((_, index) => {
                      const player = room.players?.[index];
                      return (
                        <style.WrapperPlayerSlot key={index} isEmpty={!player}>
                          {player ? (
                            <>
                              <style.WrapperPlayerAvatar
                                src={`https://i.pravatar.cc/150?img=${index}`}
                                alt={`Player ${index}`}
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                              <style.WrapperPlayerName>{player.login}</style.WrapperPlayerName>
                            </>
                          ) : (
                            <div />
                          )}
                        </style.WrapperPlayerSlot>
                      );
                    })}
                  </style.WrapperPlayersGrid>

                  <style.WrapperRoomButton 
                    onClick={() => canJoin && handleJoinRoom(room.game_id)}
                    disabled={!canJoin}
                    style={{
                      cursor: canJoin ? 'pointer' : 'not-allowed',
                      backgroundColor: isGameStarted ? '#8b7355' : (isFull ? '#FF6B6B' : '#8b7355'),
                      opacity: canJoin ? 1 : 0.6
                    }}
                  >
                    {isGameStarted ? 'началось' : (isFull ? 'Полна' : 'Присоединиться')}
                  </style.WrapperRoomButton>
                </style.WrapperRoomCard>
              );
            })
          )}
        </style.WrapperRoomsGrid>

        {isModalOpen && (
          <style.ModalOverlay onClick={handleCloseModal}>
            <style.ModalContent onClick={(e) => e.stopPropagation()}>
              <style.ModalCloseButton onClick={handleCloseModal}>×</style.ModalCloseButton>
              <style.ModalTitle>Создать новую игру</style.ModalTitle>

              <style.ModalFormGroup>
                <style.ModalLabel>Количество игроков</style.ModalLabel>
                <style.ModalSelect value={numPlayers} onChange={(e) => setNumPlayers(e.target.value)}>
                  <option value="2">2 игрока</option>
                  <option value="4">4 игрока</option>
                </style.ModalSelect>
              </style.ModalFormGroup>

              <style.ModalFormGroup>
                <style.ModalLabel>Время на ход</style.ModalLabel>
                <style.ModalSelect value={timePerMove} onChange={(e) => setTimePerMove(e.target.value)}>
                  <option value="15">15 секунд</option>
                  <option value="30">30 секунд</option>
                  <option value="45">45 секунд</option>
                </style.ModalSelect>
              </style.ModalFormGroup>

              <style.ModalButtonGroup>
                <style.ModalButton variant="cancel" onClick={handleCloseModal}>
                  Отмена
                </style.ModalButton>
                <style.ModalButton variant="create" onClick={handleSubmitNewGame}>
                  Создавать
                </style.ModalButton>
              </style.ModalButtonGroup>
            </style.ModalContent>
          </style.ModalOverlay>
        )}
      </style.WrapperContainer>
    </BackgroundComponent>
  );
};

export default WaitingRoom;