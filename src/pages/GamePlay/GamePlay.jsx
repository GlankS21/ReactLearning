import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import gameAPI from "../../api/gameAPI";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent";
import BoardGameComponent from "../../components/BoardGameComponent/BoardGameComponent";
import {
  WrapperContainer,
  WrapperMenuButton,
  WrapperBoardContainer,
  WrapperPlayerSection,
  WrapperPlayerAvatar,
  WrapperDiceIcon,
  WrapperTimerCircle,
  WrapperTimerText,
  WrapperExitMenu,
  WrapperMenuIcon,
  WrapperDiceDot,
} from "./style";

// --------3D DICE---------
const DiceAnimation = ({ number, isRolling }) => {
  const getRotation = (num) => {
    const rotations = {
      1: 'rotateX(0deg) rotateY(0deg)',
      2: 'rotateX(0deg) rotateY(-90deg)',
      3: 'rotateX(0deg) rotateY(-180deg)',
      4: 'rotateX(0deg) rotateY(90deg)',
      5: 'rotateX(-90deg) rotateY(0deg)',
      6: 'rotateX(90deg) rotateY(0deg)',
    };
    return rotations[num] || rotations[1];
  };

  const renderDots = (num) => {
    const dotStyle = {
      width: '5px',
      height: '5px',
      backgroundColor: '#333',
      borderRadius: '50%',
    };

    const dotsConfig = {
      1: [
        <div key="1" style={{ ...dotStyle, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      ],
      2: [
        <div key="1" style={{ ...dotStyle, position: 'absolute', top: '25%', left: '25%' }} />,
        <div key="2" style={{ ...dotStyle, position: 'absolute', bottom: '25%', right: '25%' }} />
      ],
      3: [
        <div key="1" style={{ ...dotStyle, position: 'absolute', top: '25%', left: '25%' }} />,
        <div key="2" style={{ ...dotStyle, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />,
        <div key="3" style={{ ...dotStyle, position: 'absolute', bottom: '25%', right: '25%' }} />
      ],
      4: [
        <div key="1" style={{ ...dotStyle, position: 'absolute', top: '25%', left: '25%' }} />,
        <div key="2" style={{ ...dotStyle, position: 'absolute', top: '25%', right: '25%' }} />,
        <div key="3" style={{ ...dotStyle, position: 'absolute', bottom: '25%', left: '25%' }} />,
        <div key="4" style={{ ...dotStyle, position: 'absolute', bottom: '25%', right: '25%' }} />
      ],
      5: [
        <div key="1" style={{ ...dotStyle, position: 'absolute', top: '25%', left: '25%' }} />,
        <div key="2" style={{ ...dotStyle, position: 'absolute', top: '25%', right: '25%' }} />,
        <div key="3" style={{ ...dotStyle, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />,
        <div key="4" style={{ ...dotStyle, position: 'absolute', bottom: '25%', left: '25%' }} />,
        <div key="5" style={{ ...dotStyle, position: 'absolute', bottom: '25%', right: '25%' }} />
      ],
      6: [
        <div key="1" style={{ ...dotStyle, position: 'absolute', top: '25%', left: '25%' }} />,
        <div key="2" style={{ ...dotStyle, position: 'absolute', top: '25%', right: '25%' }} />,
        <div key="3" style={{ ...dotStyle, position: 'absolute', top: '50%', left: '25%', transform: 'translateY(-50%)' }} />,
        <div key="4" style={{ ...dotStyle, position: 'absolute', top: '50%', right: '25%', transform: 'translateY(-50%)' }} />,
        <div key="5" style={{ ...dotStyle, position: 'absolute', bottom: '25%', left: '25%' }} />,
        <div key="6" style={{ ...dotStyle, position: 'absolute', bottom: '25%', right: '25%' }} />
      ],
    };

    return dotsConfig[num] || dotsConfig[1];
  };

  const diceStyle = {
    width: '40px',
    height: '40px',
    perspective: '1000px',
    cursor: 'default',
  };

  const cubeStyle = {
    width: '100%',
    height: '100%',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transform: isRolling ? 'rotateX(720deg) rotateY(720deg)' : getRotation(number),
    transition: isRolling ? 'none' : 'transform 0.6s ease-out',
  };

  const faceBaseStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f1f1',
    border: '2px solid #333',
    borderRadius: '4px',
  };

  const faces = [
    { num: 1, transform: 'rotateY(0deg) translateZ(20px)' },
    { num: 2, transform: 'rotateY(90deg) translateZ(20px)' },
    { num: 3, transform: 'rotateY(180deg) translateZ(20px)' },
    { num: 4, transform: 'rotateY(-90deg) translateZ(20px)' },
    { num: 5, transform: 'rotateX(90deg) translateZ(20px)' },
    { num: 6, transform: 'rotateX(-90deg) translateZ(20px)' },
  ];

  return (
    <div style={diceStyle}>
      <div style={cubeStyle}>
        {faces.map(face => (
          <div
            key={face.num}
            style={{
              ...faceBaseStyle,
              transform: face.transform,
            }}
          >
            {renderDots(face.num)}
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [rollingDice, setRollingDice] = useState(null);

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const timeRemainingRef = useRef(null);
  const isAutoPassingRef = useRef(false);
  const lastAutoPassTimeRef = useRef(0);
  const prevCurrentTurnRef = useRef(null);
  const prevDiceRef = useRef(null);

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

  useEffect(() => {
    if (!gameId || !myLogin) return;
    const handleBeforeUnload = () => {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000';
      const payload = JSON.stringify({ game_id: gameId, login: myLogin });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${serverUrl}/api/game/${gameId}/leave`,
          payload
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameId, myLogin]);

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

      if (response.data?.dice && (turnChanged || diceChanged)) {
        setRollingDice(response.data.dice);
        
        setTimeout(() => {
          setRollingDice(null);
        }, 1000);
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
  }, [gameId, myLogin, navigate]);

  // ----------ROLL DICE --------------
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
    if (isMoving || !gameState) return false;
    setIsMoving(true);
    setError(null);
    try {
      const response = await gameAPI.moveHorse(horseId);

      if (response?.success) {
        setError(null);
        
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
  }, [isMoving, gameState, fetchGameState]);

  // -----------EXIT---------------
  const handleExit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    isAutoPassingRef.current = false;
    lastAutoPassTimeRef.current = 0;

    if (gameId && myLogin) {
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
  const canMove = isMyTurn && diceRoll;

  // -----------TIME----------
  const renderTimer = (player, position) => {
    if (!player.is_turn) return null;
    const percentage = (gameState.remaining_time / gameState.step_time) * 100;
    return (
      <WrapperTimerCircle percentage={percentage} position={position}>
        <WrapperTimerText>{gameState.remaining_time}s</WrapperTimerText>
      </WrapperTimerCircle>
    );
  };

  // -----------DICE----------
  const renderDice = (player) => {
    const isCurrent = currentPlayer?.login === player.login;
    const isAnimating = isCurrent && rollingDice !== null;
    
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
            number={rollingDice || diceRoll || 1} 
            isRolling={isAnimating}
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
        {/* Menu button */}
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

        {/* Rules button */}
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

        {/* Rules modal */}
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
                <h4 style={{ color: "#4CAF50", marginTop: 0, marginBottom: 10 }}>
                  Цель игры
                </h4>
                <p style={{ lineHeight: 1.6 }}>
                  Привести все 4 свои фишки из дома к финишу раньше других игроков.
                </p>

                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                  Как играть
                </h4>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>Каждый игрок имеет 4 фишки одного цвета</li>
                  <li>Кубик автоматически бросается в начале хода</li>
                  <li>Если выпало 6, игрок получает дополнительный бросок</li>
                  <li>Фишки движутся по часовой стрелке вокруг игрового поля</li>
                </ul>

                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                  Съедание фишек
                </h4>
                <p style={{ lineHeight: 1.6 }}>
                  Если ваша фишка остановилась на клетке с фишкой соперника, фишка соперника
                  возвращается домой.
                </p>

                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                  Безопасные клетки
                </h4>
                <p style={{ lineHeight: 1.6 }}>
                  Клетки со звёздочкой считаются безопасными — фишки на них нельзя съесть.
                </p>

                <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                  Победа
                </h4>
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
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#045566")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#02343E")}
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        )}

        {/* Board and players */}
        <WrapperBoardContainer>
          {gameState.players.map((player) => (
            <WrapperPlayerSection 
              key={player.player_id} 
              position={["bottom-left", "top-left", "top-right", "bottom-right"][player.player_number - 1]}
            >
              {renderTimer(player, ["left", "left", "right", "right"][player.player_number - 1])}
              {renderDice(player)}
              <WrapperPlayerAvatar
                src={player.avatar || `https://i.pravatar.cc/150?img=${player.player_number}`}
                alt={player.login}
                title={player.login}
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
            isMyTurn={canMove}
            myLogin={myLogin}
            canMove={canMove}
          />
        </WrapperBoardContainer>

        {/* Error message */}
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