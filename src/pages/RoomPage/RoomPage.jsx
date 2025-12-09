import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import roomAPI from "../../api/roomAPI";
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
  WrapperLeaveButton,
} from "./style";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent";

const RoomPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = parseInt(searchParams.get("gameId"), 10);
  const login = localStorage.getItem("login");
  
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdownTime, setCountdownTime] = useState(null);

  const socketRef = useRef(null);
  const countdownRef = useRef(null);
  const intervalRef = useRef(null);
  const isReloadingRef = useRef(false);

  // ============================================
  // Socket.IO Connection (chỉ để handle unload)
  // ============================================
  useEffect(() => {
    console.log("Room Socket useEffect - gameId:", gameId, "login:", login);

    if (!gameId || !login) {
      console.log("Missing gameId or login, returning");
      return;
    }

    const socketURL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8000";

    const socket = io(socketURL, {
      query: {
        roomId: gameId,
        login: login,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Room socket connected");
    });

    socket.on("disconnect", () => {
      console.log("Room socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Room socket connection error:", error);
    });

    return () => {
      // Don't disconnect on unmount
    };
  }, [gameId, login]);

  // ============================================
  // Fetch Room Details (Polling mỗi 2s)
  // ============================================
  const fetchRoomDetails = useCallback(async () => {
    if (!login) {
      navigate("/ludohome");
      return;
    }

    try {
      const response = await roomAPI.getRoomPlayers(gameId);
      
      if (!response.success) {
        navigate("/ludohome");
        return;
      }

      const playerList = response.data.players || [];
      const isInRoom = playerList.some(p => p.login === login);

      // Nếu bị xóa khỏi phòng
      if (!isInRoom) {
        setError("Вы были удалены из комнаты");
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => navigate("/ludohome"), 2000);
        return;
      }

      setRoom({
        game_id: response.data.game_id,
        player_amount: response.data.max_players,
        step_time: response.data.step_time || 30,
        status: response.data.status,
      });

      setPlayers(playerList);
      setError(null);

      if (response.data.status === "started") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (countdownRef.current) clearTimeout(countdownRef.current);
        navigate(`/gameplay?gameId=${gameId}`);
      }
    } catch (err) {
      setError("Ошибка загрузки комнаты");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [gameId, login, navigate]);

  useEffect(() => {
    if (isNaN(gameId)) {
      navigate("/ludohome");
      return;
    }

    fetchRoomDetails();
    intervalRef.current = setInterval(fetchRoomDetails, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameId, login, fetchRoomDetails, navigate]);

  // ============================================
  // Unload Handlers (Socket + Beacon)
  // ============================================
  useEffect(() => {
    if (!gameId) return;

    const sessionKey = `room_reload_${gameId}`;
    const sessionId = Math.random().toString(36);
    sessionStorage.setItem(sessionKey, sessionId);

    const handleBeforeUnload = () => {
      const savedSessionId = sessionStorage.getItem(sessionKey);
      isReloadingRef.current = !!savedSessionId;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameId]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Khi tab bị ẩn hoặc không focus
      if (document.hidden) {
        console.log("Tab hidden/closed, leaving room");
        if (!gameId || !login) return;

        // Gọi API để leave room
        try {
          console.log("Calling leave room API");
          await fetch(`http://localhost:8000/api/room/leave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ game_id: gameId, login }),
            keepalive: true
          });
          console.log("Leave room API called successfully");
        } catch (err) {
          console.error('Leave room API failed:', err);
        }
      }
    };

    const handleUnload = () => {
      if (!gameId || !login) return;

      if (!isReloadingRef.current) {
        console.log("Unload event, leaving room");
        try {
          fetch(`http://localhost:8000/api/room/leave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ game_id: gameId, login }),
            keepalive: true
          }).catch(err => console.error('Leave room fetch failed:', err));
        } catch (err) {
          console.error('Leave room error:', err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("unload", handleUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("unload", handleUnload);
    };
  }, [gameId, login]);

  // ============================================
  // Leave Room Handler
  // ============================================
  const handleLeaveRoom = useCallback(async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearTimeout(countdownRef.current);

      // Emit socket event
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('playerLeavingRoom', { roomId: gameId, login: login });
      }

      await roomAPI.leaveRoom(gameId, login);

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      navigate("/ludohome");
    } catch (err) {
      setError("Ошибка при выходе из комнаты");
      console.error(err);
    }
  }, [gameId, login, navigate]);

  // ============================================
  // Countdown Logic
  // ============================================
  useEffect(() => {
    if (!room) return;

    const isRoomFull = players.length === room.player_amount;

    if (isRoomFull && countdownTime === null) {
      setCountdownTime(10);
    } else if (!isRoomFull && countdownTime !== null) {
      setCountdownTime(null);
      if (countdownRef.current) clearTimeout(countdownRef.current);
    }

    if (countdownTime !== null && countdownTime > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdownTime(countdownTime - 1);
      }, 1000);
    }

    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdownTime, players.length, room]);

  // ============================================
  // Render
  // ============================================
  if (loading) {
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <WrapperTitle>Загрузка...</WrapperTitle>
        </WrapperContainer>
      </BackgroundComponent>
    );
  }

  if (!room) {
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <WrapperTitle>Ошибка загрузки комнаты</WrapperTitle>
          <button 
            onClick={handleLeaveRoom}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#FFD700',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            На главную
          </button>
        </WrapperContainer>
      </BackgroundComponent>
    );
  }

  if (error) {
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <WrapperTitle style={{ color: '#FF6B6B' }}>{error}</WrapperTitle>
          <button 
            onClick={() => navigate("/ludohome")}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#FFD700',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            На главную
          </button>
        </WrapperContainer>
      </BackgroundComponent>
    );
  }

  const isRoomFull = players.length === room.player_amount;

  return (
    <BackgroundComponent opacity={0.95}>
      <WrapperContainer>
        {/* Кнопка назад */}
        <WrapperBackButton onClick={handleLeaveRoom}>←</WrapperBackButton>

        {/* Заголовок */}
        <WrapperTitle>КОМНАТА {room.game_id}</WrapperTitle>

        {/* Информация о комнате */}
        <WrapperRoomDetails>
          <span>Игроки: {players.length}/{room.player_amount}</span>
          <span>Время на ход: {room.step_time}с</span>
        </WrapperRoomDetails>

        {/* Статус комнаты */}
        {isRoomFull && (
          <div style={{
            textAlign: 'center',
            color: '#FFD700',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}>
            ✅ Комната заполнена! Игра начинается...
            {countdownTime !== null && <div>({countdownTime})</div>}
          </div>
        )}

        {/* Сетка игроков */}
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

        {/* Кнопка выхода */}
        <WrapperButtonGroup>
          <WrapperLeaveButton onClick={handleLeaveRoom}>
            ВЫЙТИ ИЗ КОМНАТЫ
          </WrapperLeaveButton>
        </WrapperButtonGroup>
      </WrapperContainer>
    </BackgroundComponent>
  );
};

export default RoomPage;