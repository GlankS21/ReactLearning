import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import gameAPI from "../../api/gameAPI";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent";
import BoardGameComponent from "../../components/BoardGameComponent/BoardGameComponent";
import DefaultAvatar from "../../components/DefaultAvatar/DefaultAvatar";
import DiceAnimation from "../../components/DiceAnimation/DiceAnimation";
import RulesModal from "../../components/RulesModal/RulesModal";
import RulesButton from "../../components/RulesButton/RulesButton";
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
  const autoPassTimeoutRef = useRef(null);
  const gameStateRef = useRef(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
    return () => {
      if (autoPassTimeoutRef.current) {
        clearTimeout(autoPassTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // Kiểm tra xem có ngựa nào di chuyển được không
  // ============================================
  const canAnyHorseMove = useCallback((currentGameState, diceValue) => {
    if (!currentGameState || !diceValue) {
      return false;
    }

    const currentPlayer = currentGameState.players.find(p => p.is_turn);
    if (!currentPlayer) {
      return false;
    }

    const playerColor = currentPlayer.color;
    const horses = currentPlayer.horses || [];

    const HOME_RANGES = {
      green: { start: 52, end: 57 },
      yellow: { start: 58, end: 63 },
      blue: { start: 64, end: 69 },
      red: { start: 70, end: 75 },
    };
    
    const home = HOME_RANGES[playerColor];
    if (!home) return false;
    
    for (const horse of horses) {
      const currentCell = horse.cell_number;
      
      const isInHomeRange = currentCell >= home.start && currentCell <= home.end;
      if (isInHomeRange) {
        const newCell = currentCell + diceValue;
        if (newCell <= home.end) return true;
      } else {
        return true;
      }
    }

    return false;
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
        if (autoPassTimeoutRef.current) {
          clearTimeout(autoPassTimeoutRef.current);
        }
        setCanClickHorse(false);
        setIsRollingDice(true);
        diceRollIdRef.current += 1;
      }

      prevCurrentTurnRef.current = response.data?.current_turn;
      prevDiceRef.current = response.data?.dice;

      // Chỉ cập nhật remaining_time từ API khi turn thay đổi
      if (turnChanged) {
        timeRemainingRef.current = Number(response.data?.remaining_time) || 0;
        setGameState(response.data);
      } else {
        // Giữ nguyên remaining_time local, chỉ cập nhật các field khác
        setGameState(prev => ({
          ...response.data,
          remaining_time: prev?.remaining_time ?? response.data?.remaining_time
        }));
      }
      
      setError(null);

      if (response.data?.winner) {
        setWinner(response.data.winner);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [gameId, myLogin, navigate, canClickHorse]);

  // ============================================
  // Gọi API pass turn
  // ============================================
  const callPassTurn = useCallback(async () => {
    if (isAutoPassingRef.current) return;
    isAutoPassingRef.current = true;

    try {
      await gameAPI.passTurn(gameId);
      await fetchGameState();
    } catch (err) {
      console.error('[callPassTurn] Error:', err);
    } finally {
      isAutoPassingRef.current = false;
    }
  }, [gameId, fetchGameState]);

  // ============================================
  // Callback khi animation dice kết thúc
  // ============================================
  const handleDiceAnimationEnd = useCallback(() => {
    setIsRollingDice(false);
    
    if (autoPassTimeoutRef.current) {
      clearTimeout(autoPassTimeoutRef.current);
    }

    // Đợi 1.5s sau khi dice dừng để người chơi nhìn thấy kết quả
    autoPassTimeoutRef.current = setTimeout(() => {
      const currentState = gameStateRef.current;
      if (!currentState) {
        setCanClickHorse(true);
        return;
      }
      
      const canMove = canAnyHorseMove(currentState, currentState.dice);
      
      if (canMove) {
        setCanClickHorse(true);
      } else {
        // Đợi thêm 2s trước khi pass turn để người chơi nhìn thấy
        setTimeout(() => {
          callPassTurn();
        }, 2000);
      }
    }, 1000);
  }, [canAnyHorseMove, callPassTurn]);

  // ----------POLL --------------
  useEffect(() => {
    if (!gameId) return;

    fetchGameState();
    pollRef.current = setInterval(() => {
      if (!isAutoPassingRef.current && !isRollingDice) {
        fetchGameState();
      }
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gameId, fetchGameState, isRollingDice]);

  // -----------RENDER TIME--------------
  useEffect(() => {
    if (!gameState) return;
    if (timerRef.current) clearInterval(timerRef.current);

    if (!gameState.current_turn) return;

    // Chỉ set initial time nếu chưa có
    if (timeRemainingRef.current === null) {
      timeRemainingRef.current = Number(gameState.remaining_time) || 0;
    }

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
    if (isMoving || !gameState || !canClickHorse) return false;
    setIsMoving(true);
    setError(null);
    try {
      const response = await gameAPI.moveHorse(horseId);

      if (response?.success) {
        setError(null);
        setCanClickHorse(false);

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
    if (autoPassTimeoutRef.current) clearTimeout(autoPassTimeoutRef.current);
    isAutoPassingRef.current = false;
    lastAutoPassTimeRef.current = 0;

    if (gameId && myLogin) {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('playerLeaving', { gameId, login: myLogin });
      }

      gameAPI.leaveGame(gameId).catch(err => {
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
            key={diceRollIdRef.current}
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

        <RulesButton onClick={() => setShowRules(true)} />
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

        <WrapperBoardContainer>
          {gameState.players.map((player) => (
            <WrapperPlayerSection
              key={player.player_id}
              position={["bottom-left", "top-left", "top-right", "bottom-right"][player.player_number - 1]}
            >
              {renderTimer(player, ["left", "left", "right", "right"][player.player_number - 1])}
              {renderDice(player)}
              
              {/* Avatar với tên player bên dưới */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}>
                <DefaultAvatar
                  login={player.login}
                  size={50}
                  style={{
                    border: player.is_turn ? "3px solid #FFD700" : "2px solid white",
                    opacity: player.is_turn ? 1 : 0.7,
                    transition: "all 0.3s"
                  }}
                />
                <span style={{
                  color: player.is_turn ? '#FFD700' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: player.is_turn ? 'bold' : 'normal',
                  maxWidth: '70px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}>
                  {player.login === myLogin ? 'Вы' : player.login}
                </span>
              </div>
            </WrapperPlayerSection>
          ))}

          <BoardGameComponent
            gameState={gameState}
            onMoveHorse={handleMoveHorse}
            diceRoll={diceRoll}
            isMyTurn={isMyTurn}
            myLogin={myLogin}
            canMove={canMove}
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