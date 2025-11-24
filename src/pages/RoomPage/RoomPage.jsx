import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  WrapperContainer,
  WrapperBackButton,
  WrapperTitle,
  WrapperRoomDetails,
  WrapperPlayersGrid,
  WrapperPlayerSlot,
  WrapperPlayerAvatar,
  WrapperPlayerName,
  WrapperButtonGroup,
  WrapperStartButton,
  WrapperLeaveButton,
} from "./style";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";


const ErrorModal = ({ message, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: '#222',
        border: '2px solid #FFD700',
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '400px',
        textAlign: 'center',
        color: 'white',
      }}>
        <h2 style={{ marginTop: 0, color: '#FFD700' }}>⚠️ Ошибка</h2>
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>{message}</p>
        <button 
          onClick={onClose}
          style={{
            backgroundColor: '#FFD700',
            color: '#000',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

const RoomPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = parseInt(searchParams.get("gameId"), 10);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const lastPlayerCountRef = useRef(0);

  const fetchRoomDetails = async () => {
    const token = localStorage.getItem("authToken");
    const login = localStorage.getItem("login");

    if (!token) {
      navigate("/waiting?players=2");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/room/${gameId}/players`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!data.success) {
        navigate("/waiting");
        return;
      }

      const playerList = data.data.players || [];
      const isInRoom = playerList.some(p => p.login === login);

      if (!isInRoom) {
        setError("Вы были удалены из комнаты");
        setTimeout(() => navigate("/ludohome"), 2000);
        return;
      }

      setRoom({
        game_id: data.data.game_id,
        player_amount: data.data.max_players,
        step_time: data.data.step_time || 30,
      });
      setPlayers(playerList);
      setIsCreator(playerList[0]?.login === login);
      lastPlayerCountRef.current = playerList.length;

      if (data.data.status === "started") {
        navigate(`/gameplay?gameId=${gameId}`);
      }
    } catch (err) {
      setError("Ошибка загрузки комнаты");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isNaN(gameId)) {
      navigate("/waiting?players=2");
      return;
    }

    fetchRoomDetails();
    intervalRef.current = setInterval(fetchRoomDetails, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameId, navigate]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const token = localStorage.getItem("authToken");
      const login = localStorage.getItem("login");

      if (!gameId || !login || !token) return;

      const data = JSON.stringify({ game_id: gameId, login });
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon(`${API_URL}/api/room/leave`, blob);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameId]);

  const handleLeaveRoom = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const login = localStorage.getItem("login");

      if (intervalRef.current) clearInterval(intervalRef.current);

      await fetch(`${API_URL}/api/room/leave`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ game_id: gameId, login }),
      });

      navigate("/ludohome");
    } catch (err) {
      setError("Ошибка при выходе из комнаты");
    }
  };

  // Start game
  const handleStartGame = async () => {
    if (players.length < room.player_amount) {
      setError(`Требуется ${room.player_amount} игроков. Сейчас: ${players.length}`);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/game/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ game_id: gameId }),
      });

      const data = await response.json();

      if (data.success) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        navigate(`/gameplay?gameId=${gameId}`);
      } else {
        setError(data.message || "Невозможно начать игру");
      }
    } catch (err) {
      setError("Ошибка подключения");
    }
  };

  if (loading) {
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <WrapperTitle>Загрузка...</WrapperTitle>
        </WrapperContainer>
      </BackgroundComponent>
    );
  }

  return (
    <BackgroundComponent opacity={0.95}>
      <WrapperContainer>
        <WrapperBackButton onClick={handleLeaveRoom}>←</WrapperBackButton>
        <WrapperTitle>КОМНАТА {room.game_id}</WrapperTitle>

        <WrapperRoomDetails>
          <span>Игроки: {players.length}/{room.player_amount}</span>
          <span>Время на ход: {room.step_time}с</span>
        </WrapperRoomDetails>

        <WrapperPlayersGrid>
          {Array.from({ length: room.player_amount }).map((_, index) => {
            const player = players[index];
            return (
              <WrapperPlayerSlot key={index} $isEmpty={!player}>
                {player ? (
                  <>
                    <WrapperPlayerAvatar
                      src={`https://i.pravatar.cc/150?img=${index}`}
                      alt={player.login}
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                    <WrapperPlayerName>{player.login || "Неизвестно"}</WrapperPlayerName>
                  </>
                ) : (
                  <div style={{ color: "#999", textAlign: "center" }}>⏳ Ожидание...</div>
                )}
              </WrapperPlayerSlot>
            );
          })}
        </WrapperPlayersGrid>

        <WrapperButtonGroup>
          {isCreator ? (
            <WrapperStartButton
              onClick={handleStartGame}
              disabled={players.length < room.player_amount}
            >
              НАЧАТЬ ИГРУ
            </WrapperStartButton>
          ) : (
            <WrapperLeaveButton onClick={handleLeaveRoom}>
              ВЫЙТИ ИЗ КОМНАТЫ
            </WrapperLeaveButton>
          )}
        </WrapperButtonGroup>

        {error && (
          <ErrorModal 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}
      </WrapperContainer>
    </BackgroundComponent>
  );
};

export default RoomPage;