import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import gameAPI from "../../api/gameAPI";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent";
import BoardGameComponent from "../../components/BoardGameComponent/BoardGameComponent";
import DefaultAvatar from "../../components/DefaultAvatar/DefaultAvatar";
import DiceAnimation from "../../components/DiceAnimation/DiceAnimation";
import {
  WrapperContainer,
  WrapperMenuButton,
  WrapperBoardContainer,
  WrapperPlayerSection,
  WrapperDiceIcon,
  WrapperTimerCircle,
  WrapperTimerText,
  WrapperExitMenu,
  WrapperMenuIcon,
  WrapperDiceDot,
} from "./style";

const GamePlay = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const gameId = parseInt(searchParams.get("gameId"));
  const myLogin = localStorage.getItem("login");
  const authToken = localStorage.getItem("authToken");

  const [showExit, setShowExit] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState(null);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [canClickHorse, setCanClickHorse] = useState(false); 

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const timeRemainingRef = useRef(null);
  const isAutoPassingRef = useRef(false);
  const lastAutoPassTimeRef = useRef(0);
  const prevCurrentTurnRef = useRef(null);
  const prevDiceRef = useRef(null);
  const diceRollIdRef = useRef(0);

  // ---------SOCKET----------
  useEffect(() => {
    if (!gameId || !myLogin) return;
    if (socketRef.current?.connected) return;
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    socketRef.current = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      query: {
        gameId: gameId.toString(),
        login: myLogin,
        token: authToken || ''
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      const gameInfo = {
        gameId,
        login: myLogin,
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem(`activeGame_${myLogin}`, JSON.stringify(gameInfo));
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[Socket] Connection Error:', error.message);
    });

    socketRef.current.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [gameId, myLogin, authToken]);

  const handleDiceAnimationEnd = useCallback(() => {
    setIsRollingDice(false);
    setCanClickHorse(true);  
  }, []);

  // ---------STATUS-----------
  const fetchGameState = useCallback(async () => {
  if (!gameId) return;

  try {
    const response = await gameAPI.getGameState(gameId);
    if (!response?.success) {
      if (response?.code === 404) {
        setError("Игра закончилась");
        if (pollRef.current) clearInterval(pollRef.current);
        setTimeout(() => navigate("/ludohome"), 2000);
      }
      return;
    }

    const isStillInGame = response.data?.players?.some(p => p.login === myLogin);
    if (!isStillInGame) {
      setError("Вы удалены из игры");
      if (pollRef.current) clearInterval(pollRef.current);
      setTimeout(() => navigate("/ludohome"), 2000);
      return;
    }

    const turnChanged = prevCurrentTurnRef.current !== response.data?.current_turn;
    const diceChanged = prevDiceRef.current !== response.data?.dice;
    const timeReset = response.data?.remaining_time >= response.data?.step_time - 1;
    const hadPreviousDice = prevDiceRef.current !== null;
    
    const shouldTriggerAnimation = response.data?.dice && (
      turnChanged || 
      diceChanged || 
      (timeReset && hadPreviousDice && canClickHorse)  
    );

    if (shouldTriggerAnimation) {
      setCanClickHorse(false);
      setIsRollingDice(true);
      diceRollIdRef.current += 1;
    }

    prevCurrentTurnRef.current = response.data?.current_turn;
    prevDiceRef.current = response.data?.dice;

    setGameState(response.data);
    setError(null);

    if (response.data?.winner) {
      setWinner(response.data.winner);
    }
  } catch (err) {
    setError(err.message);
  }
}, [gameId, myLogin, navigate, canClickHorse]);

  // ----------POLL --------------
  useEffect(() => {
    if (!gameId) return;
    
    fetchGameState();
    pollRef.current = setInterval(() => {
      if (!isAutoPassingRef.current) {
        fetchGameState();
      }
    }, 1000);
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gameId, fetchGameState]);

  // -----------RENDER TIME--------------
  useEffect(() => {
    if (!gameState) return;
    if (timerRef.current) clearInterval(timerRef.current);

    if (!gameState.current_turn) return;

    timeRemainingRef.current = Number(gameState.remaining_time) || 0;

    timerRef.current = setInterval(() => {
      timeRemainingRef.current = Math.max(0, timeRemainingRef.current - 1);

      setGameState(prev => prev ? { ...prev, remaining_time: timeRemainingRef.current } : prev);

      if (timeRemainingRef.current === 0) {
        clearInterval(timerRef.current);

        const now = Date.now();
        if (isAutoPassingRef.current || (now - lastAutoPassTimeRef.current) < 2000) return;

        isAutoPassingRef.current = true;
        lastAutoPassTimeRef.current = now;

        new Promise(resolve => setTimeout(resolve, 500))
          .then(() => fetchGameState())
          .catch(err => {
            console.error('[Timer] Auto-pass failed:', err);
            return new Promise(resolve => setTimeout(resolve, 500)).then(() => fetchGameState());
          })
          .finally(() => {
            isAutoPassingRef.current = false;
          });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.current_turn, gameId, fetchGameState]);

  // --------------MOVE----------------
  const handleMoveHorse = useCallback(async (horseId) => {
    if (isMoving || !gameState || !canClickHorse) return false;  // Check canClickHorse
    setIsMoving(true);
    setError(null);
    try {
      const response = await gameAPI.moveHorse(horseId);

      if (response?.success) {
        setError(null);
        setCanClickHorse(false);  // Disable sau khi move
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchGameState();

        setIsMoving(false);
        return true;
      } else {
        setError(response?.message);
        setIsMoving(false);
        return false;
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
      setIsMoving(false);
      return false;
    }
  }, [isMoving, gameState, canClickHorse, fetchGameState]);

  // -----------EXIT---------------
  const handleExit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    isAutoPassingRef.current = false;
    lastAutoPassTimeRef.current = 0;

    if (gameId && myLogin) {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('playerLeaving', { gameId, login: myLogin });
      }
      
      gameAPI.leaveGame(gameId, myLogin).catch(err => {
        console.error('[handleExit]', err);
      });
    }
    
    localStorage.removeItem(`activeGame_${myLogin}`);
    navigate("/ludohome");
  }, [navigate, gameId, myLogin]);

  // ---------AUTO LEAVE----------
  useEffect(() => {
    if (!winner) return;

    const timer = setTimeout(() => {
      handleExit();
    }, 5000);

    return () => clearTimeout(timer);
  }, [winner, handleExit]);

  // ------------WINNER------------
  if (winner) {
    const winnerPlayer = gameState?.players.find(p => p.color === winner);
    let winnerLogin = winnerPlayer?.login || winner;
    if (winnerLogin === myLogin) winnerLogin = 'You';
    localStorage.removeItem(`activeGame_${myLogin}`);
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <div style={{ color: "white", fontSize: 32, textAlign: "center" }}>
            <h1>🎉 {winnerLogin} win! 🎉</h1>
            <button
              onClick={handleExit}
              style={{ 
                marginTop: 30, 
                padding: "12px 40px", 
                fontSize: 18, 
                cursor: "pointer",
                backgroundColor: "#02343E",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                color: "white"
              }}
            >
              На главную
            </button>
          </div>
        </WrapperContainer>
      </BackgroundComponent>
    );
  }

  if (!gameState) {
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <div style={{ color: "white", fontSize: 20, textAlign: "center" }}>
            <div>GameID: {gameId || "NOT FOUND"}</div>
            <div style={{ marginTop: 10 }}>
              {error ? `${error}` : "⏳ Загрузка игры..."}
            </div>
          </div>
        </WrapperContainer>
      </BackgroundComponent>
    );
  }

  const currentPlayer = gameState.players.find(p => p.is_turn);
  const isMyTurn = currentPlayer?.login === myLogin;
  const diceRoll = gameState.dice;
  // canMove bây giờ phụ thuộc vào canClickHorse
  const canMove = isMyTurn && diceRoll && canClickHorse && !isRollingDice;

  const renderTimer = (player, position) => {
    if (!player.is_turn) return null;
    const percentage = (gameState.remaining_time / gameState.step_time) * 100;
    return (
      <WrapperTimerCircle percentage={percentage} position={position}>
        <WrapperTimerText>{gameState.remaining_time}s</WrapperTimerText>
      </WrapperTimerCircle>
    );
  };

  const renderDice = (player) => {
    const isCurrent = currentPlayer?.login === player.login;
    
    return (
      <div
        style={{
          cursor: "default",
          opacity: isCurrent ? 1 : 0.5,
          transform: isCurrent ? "scale(1)" : "scale(0.9)",
          transition: "all 0.2s",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isCurrent ? (
          <DiceAnimation 
            key={diceRollIdRef.current}  // Key để force re-render khi roll mới
            number={diceRoll || 1} 
            isRolling={isRollingDice}
            onAnimationEnd={handleDiceAnimationEnd}
          />
        ) : (
          <WrapperDiceIcon>
            <WrapperDiceDot className="top-left" />
            <WrapperDiceDot className="top-right" />
            <WrapperDiceDot className="bottom-left" />
            <WrapperDiceDot className="bottom-right" />
          </WrapperDiceIcon>
        )}
      </div>
    );
  };

  return (
    <BackgroundComponent opacity={0.95}>
      <WrapperContainer>
        <WrapperMenuButton onClick={() => setShowExit(prev => !prev)}>
          <WrapperMenuIcon />
          <WrapperMenuIcon />
          <WrapperMenuIcon />
        </WrapperMenuButton>
        
        {showExit && (
          <WrapperExitMenu onClick={handleExit}>
            Выйти из игры
          </WrapperExitMenu>
        )}

        <button
          onClick={() => setShowRules(true)}
          style={{
            position: "fixed",
            right: 20,
            top: 20,
            width: 50,
            height: 50,
            borderRadius: "50%",
            backgroundColor: "#FFD700",
            border: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 100,
          }}
        >
          ?
        </button>

        {showRules && (
          <div
            onClick={() => setShowRules(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                padding: 30,
                maxWidth: 600,
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowRules(false)}
                style={{
                  position: "absolute",
                  top: 15,
                  right: 15,
                  background: "none",
                  border: "none",
                  fontSize: 32,
                  cursor: "pointer",
                  color: "#666",
                  padding: 0,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                }}
              >
                ×
              </button>
              <h2 style={{ marginTop: 0, marginBottom: 25, color: "#333", textAlign: "center" }}>
                Правила игры Лудо
              </h2>
              <div
                style={{
                  padding: 20,
                  border: "2px solid #ddd",
                  borderRadius: 12,
                  color: "#333",
                }}
              >
                <h4 style={{ color: "#4CAF50", marginTop: 0, marginBottom: 10 }}>Цель игры</h4>
                <p style={{ lineHeight: 1.6 }}>
                  Привести все 4 свои фишки из дома к финишу раньше других игроков.
                </p>
                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>Как играть</h4>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>Каждый игрок имеет 4 фишки одного цвета</li>
                  <li>Кубик автоматически бросается в начале хода</li>
                  <li>Если выпало 6, игрок получает дополнительный бросок</li>
                  <li>Фишки движутся по часовой стрелке вокруг игрового поля</li>
                </ul>
                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>Съедание фишек</h4>
                <p style={{ lineHeight: 1.6 }}>
                  Если ваша фишка остановилась на клетке с фишкой соперника, фишка соперника возвращается домой.
                </p>
                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>Безопасные клетки</h4>
                <p style={{ lineHeight: 1.6 }}>
                  Клетки со звёздочкой считаются безопасными — фишки на них нельзя съесть.
                </p>
                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>Победа</h4>
                <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
                  Побеждает тот, кто первым приведёт все 4 фишки к финишу.
                </p>
              </div>
              <button
                onClick={() => setShowRules(false)}
                style={{
                  marginTop: 30,
                  width: "100%",
                  padding: 15,
                  backgroundColor: "#02343E",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        )}

        <WrapperBoardContainer>
          {gameState.players.map((player) => (
            <WrapperPlayerSection 
              key={player.player_id} 
              position={["bottom-left", "top-left", "top-right", "bottom-right"][player.player_number - 1]}
            >
              {renderTimer(player, ["left", "left", "right", "right"][player.player_number - 1])}
              {renderDice(player)}
              <DefaultAvatar 
                login={player.login} 
                size={50}
                style={{
                  border: player.is_turn ? "3px solid #FFD700" : "2px solid white",
                  opacity: player.is_turn ? 1 : 0.7,
                  transition: "all 0.3s"
                }}
              />
            </WrapperPlayerSection>
          ))}

          <BoardGameComponent
            gameState={gameState}
            onMoveHorse={handleMoveHorse}
            diceRoll={diceRoll}
            isMyTurn={isMyTurn}
            myLogin={myLogin}
            canMove={canMove}  // Truyền canMove để BoardGameComponent biết khi nào hiển thị border vàng
          />
        </WrapperBoardContainer>

        {error && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#222',
            border: '2px solid #FFD700',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '400px',
            textAlign: 'center',
            color: 'white',
            zIndex: 9999,
          }}>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Закрыть
            </button>
          </div>
        )}
      </WrapperContainer>
    </BackgroundComponent>
  );
};

export default GamePlay;