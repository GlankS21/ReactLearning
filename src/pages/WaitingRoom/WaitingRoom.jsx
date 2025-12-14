import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import roomAPI from "../../api/roomAPI";
import gameAPI from "../../api/gameAPI";
import * as style from "./style";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent";
import DefaultAvatar from "../../components/DefaultAvatar/DefaultAvatar";

const WaitingRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const playerFilter = parseInt(searchParams.get("players")) || 4;
  const myLogin = localStorage.getItem("login");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPlayers, setNumPlayers] = useState("4");
  const [timePerMove, setTimePerMove] = useState("30");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState(null);
  const [rejoinLoading, setRejoinLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "", title: "" });

  const intervalRef = useRef(null);
  const showNotification = (type, title, message) => { setNotification({ show: true, type, title, message }); };
  const closeNotification = () => { setNotification({ show: false, type: "", message: "", title: "" });};

  useEffect(() => {
    if (!myLogin) return;

    const gameInfoStr = localStorage.getItem(`activeGame_${myLogin}`);
    if (gameInfoStr) {
      try {
        const gameInfo = JSON.parse(gameInfoStr);
        setActiveGame(gameInfo);
      } 
      catch (err) {
        console.error(err);
      }
    }
  }, [myLogin]);

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.listRooms();
      if (response.success && Array.isArray(response.data?.games)) {
        setRooms(response.data.games);
      }
    } 
    catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    intervalRef.current = setInterval(fetchRooms, 1000);
    
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleRejoinGame = async () => {
    if (!activeGame) return;
    
    setRejoinLoading(true);
    try {
      const response = await gameAPI.getGameState(activeGame.gameId);
      
      if (response?.success) {
        const isStillInGame = response.data?.players?.some(p => p.login === myLogin);  
        if (isStillInGame) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigate(`/gameplay?gameId=${activeGame.gameId}`);
        } else {
          localStorage.removeItem(`activeGame_${myLogin}`);
          setActiveGame(null);
          showNotification("error", "Удалены из игры", "Вас удалили из игры");
        }
      } 
      else {
        localStorage.removeItem(`activeGame_${myLogin}`);
        setActiveGame(null);
        showNotification("info", "Игра завершена", "Игра закончилась!");
      }
    } 
    catch (err) {
      localStorage.removeItem(`activeGame_${myLogin}`);
      setActiveGame(null);
      showNotification("info", "Игра завершена", "Игра закончилась!");
    } finally {
      setRejoinLoading(false);
    }
  };

  const handleClearGame = async () => {
    if (!myLogin) return;
    
    try {
      await gameAPI.leaveGame(activeGame.gameId, myLogin);
    } catch (err) {
      console.error('Error leaving game:', err);
    }
    
    localStorage.removeItem(`activeGame_${myLogin}`);
    setActiveGame(null);
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showNotification("warning", "Требуется вход", "Пожалуйста, войдите в систему");
        setTimeout(() => navigate("/SignIn"), 1500);
        return;
      }

      const response = await roomAPI.joinRoom(roomId);

      if (response.success) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        navigate(`/room?gameId=${roomId}`);
      } else {
        showNotification("error", "Ошибка", response.message || "Не удалось присоединиться к комнате");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      showNotification("error", "Ошибка подключения", "Не удается подключиться к серверу");
    }
  };

  const handleSubmitNewGame = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showNotification("warning", "Требуется вход", "Пожалуйста, войдите в систему");
        setTimeout(() => navigate("/SignIn"), 1500);
        return;
      }

      const response = await roomAPI.createRoom(parseInt(numPlayers), parseInt(timePerMove));

      if (response.success) {
        const gameId = response.data.game_id;
        handleCloseModal();
        if (intervalRef.current) clearInterval(intervalRef.current);
        await handleJoinRoom(gameId);
      } else {
        showNotification("error", "Ошибка", response.message || "Не удалось создать игру");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      showNotification("error", "Ошибка подключения", "Не удается подключиться к серверу");
    }
  };

  const handleCreateGame = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNumPlayers("4");
    setTimePerMove("30");
  };

  const NotificationModal = () => {
    if (!notification.show) return null;

    const getIcon = () => {
      switch (notification.type) {
        case "success": return "✓";
        case "error": return "✕";
        case "warning": return "⚠";
        case "info": return "ℹ";
        default: return "ℹ";
      }
    };

    const getColor = () => {
      switch (notification.type) {
        case "success": return "#4caf50";
        case "error": return "#f44336";
        case "warning": return "#ff9800";
        case "info": return "#2196f3";
        default: return "#2196f3";
      }
    };

    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,}} onClick={closeNotification}>
        <div
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: `2px solid ${getColor()}`, borderRadius: 15, padding: "30px 40px", maxWidth: 400, textAlign: "center", color: "white", }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{ width: 60, height: 60, borderRadius: "50%", backgroundColor: getColor(), display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, fontWeight: "bold",}}
          >
            {getIcon()}
          </div>
          <h3 style={{ margin: "0 0 10px", fontSize: 20, color: getColor() }}> {notification.title} </h3>
          <p style={{ margin: "0 0 25px", fontSize: 16, color: "#ccc" }}> {notification.message}</p>
          <button
            onClick={closeNotification}
            style={{ padding: "12px 40px", fontSize: 16, fontWeight: "bold", backgroundColor: getColor(), color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", transition: "all 0.3s",}}
            onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            OK
          </button>
        </div>
      </div>
    );
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
        <style.WrapperBackButton onClick={() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigate("/ludohome");
        }}>←</style.WrapperBackButton>
        
        <style.WrapperTitle>ТУРНИР</style.WrapperTitle>

        <NotificationModal />

        {activeGame && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 15, padding: 40, maxWidth: 500, textAlign: 'center', color: 'white'}}>
              <h2 style={{ color: '#d19200ff', marginTop: 0, fontSize: 24 }}>Вы в игре!</h2>
              <p style={{ fontSize: 18, marginBottom: 10 }}>
                У вас идёт игра. Хотите присоединиться снова?
              </p>
              <p style={{ fontSize: 14, color: '#aaa', marginBottom: 30 }}>
                Game ID: {activeGame.gameId}
              </p>

              <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
                <button
                  onClick={handleRejoinGame}
                  disabled={rejoinLoading}
                  style={{
                    padding: '15px 40px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: rejoinLoading ? 'not-allowed' : 'pointer',
                    opacity: rejoinLoading ? 0.7 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  {rejoinLoading ? '⏳ Loading...' : 'Присоединиться'}
                </button>

                <button
                  onClick={handleClearGame}
                  disabled={rejoinLoading}
                  style={{
                    padding: '15px 40px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 8,
                    cursor: rejoinLoading ? 'not-allowed' : 'pointer',
                    opacity: rejoinLoading ? 0.7 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}

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
                        <style.WrapperPlayerSlot key={index}>
                          {player ? (
                            <>
                              <DefaultAvatar login={player.login} size={50} />
                              <style.WrapperPlayerName>{player.login}</style.WrapperPlayerName>
                            </>
                          ) : (
                            <style.WrapperEmptySlot />
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