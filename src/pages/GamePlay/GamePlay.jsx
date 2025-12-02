import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gameAPI from "../../api/gameAPI";
import roomAPI from "../../api/roomAPI";
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

const GamePlay = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const gameId = parseInt(searchParams.get("gameId"));
  const myLogin = localStorage.getItem("login");

  const [showExit, setShowExit] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [winner, setWinner] = useState(null);
  const [diceRoll, setDiceRoll] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const timeRemainingRef = useRef(null);
  const isAutoPassingRef = useRef(false);
  const lastAutoPassTimeRef = useRef(0);

  // Fetch game state
  const fetchGameState = useCallback(async () => {
    if (!gameId) return;

    try {
      const response = await gameAPI.getGameState(gameId);
      if (!response?.success) return;
      setGameState(response.data);
      setError(null);

      // ✅ Winner đã có trong response.data
      if (response.data?.winner) {
        setWinner(response.data.winner);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  }, [gameId]);

  // Polling game state
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

  // Timer logic
  useEffect(() => {
    if (!gameState) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const currentPlayer = gameState.players.find(p => p.is_turn);
    if (!currentPlayer) return;

    timeRemainingRef.current = currentPlayer.remaining_time;
    timerRef.current = setInterval(() => {
      timeRemainingRef.current = Math.max(0, timeRemainingRef.current - 1);
      setGameState(prev => {
        if (!prev) return prev;
        const current = prev.players.find(p => p.is_turn);
        if (!current) return prev;
        
        return {
          ...prev,
          players: prev.players.map(p =>
            p.player_id === current.player_id 
              ? { ...p, remaining_time: timeRemainingRef.current } 
              : p
          )
        };
      });

      if (timeRemainingRef.current === 0) {
        clearInterval(timerRef.current);
        const now = Date.now();
        if (isAutoPassingRef.current || (now - lastAutoPassTimeRef.current) < 2000) {
          return;
        }
        
        isAutoPassingRef.current = true;
        lastAutoPassTimeRef.current = now;
        
        gameAPI.passMove(gameId)
          .then(res => {
            setDiceRoll(null);
            return new Promise(resolve => setTimeout(resolve, 500)).then(() => fetchGameState());
          })
          .catch(err => {
            console.error('Auto-pass failed:', err);
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
  }, [gameState?.players.find(p => p.is_turn)?.player_id, gameId, fetchGameState]);

  // Handle before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!gameId || !myLogin) return;
      
      try {
        roomAPI.leaveRoom(gameId, myLogin).catch(() => {});
      } catch (err) {}
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameId, myLogin]);

  // Roll dice
  const handleRollDice = useCallback(async () => {
    if (loading || !gameState) return;
    try {
      setLoading(true);
      const response = await gameAPI.rollDice(gameId);
      
      if (response?.success) {
        setDiceRoll(response.data.roll);
        setError(null);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchGameState();
      } else {
        const errorMsg = response?.message;
        setError(errorMsg);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [gameId, gameState, loading, fetchGameState]);

  // Move horse
  const handleMoveHorse = useCallback(async (horseId) => {
    if (isMoving || !gameState || !diceRoll) return false;
    setIsMoving(true);
    setError(null);
    try {
      const response = await gameAPI.moveHorse(gameId, horseId);

      if (response?.success) {
        setDiceRoll(null);
        setError(null);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchGameState();
        // ✅ Winner check đã gồm trong fetchGameState

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
  }, [gameId, isMoving, gameState, diceRoll, fetchGameState]);

  // Exit game
  const handleExit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    isAutoPassingRef.current = false;
    lastAutoPassTimeRef.current = 0;

    if (gameId && myLogin) {
      roomAPI.leaveRoom(gameId, myLogin).catch(err => {
        console.error(err);
      });
    }

    navigate("/ludohome");
  }, [navigate, gameId, myLogin]);

  // Winner screen
  if (winner) {
    const winnerPlayer = gameState?.players.find(p => p.color === winner);
    let winnerLogin = winnerPlayer?.login || winner;
    if (winnerLogin === myLogin) winnerLogin = 'You';
    
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <div style={{ color: "white", fontSize: 32, textAlign: "center" }}>
            <h1>{winnerLogin} win !</h1>
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

  // Loading screen
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

  // Determine current state
  const currentPlayer = gameState.players.find(p => p.is_turn);
  const isMyTurn = currentPlayer?.login === myLogin;
  
  const hasRolled = !!diceRoll;
  const canRoll = isMyTurn && !hasRolled && !loading;
  const canMove = isMyTurn && hasRolled && !isMoving;

  // Render timer
  const renderTimer = (player, position) => {
    if (!player.is_turn) return null;
    const percentage = (player.remaining_time / gameState.step_time) * 100;
    return (
      <WrapperTimerCircle percentage={percentage} position={position}>
        <WrapperTimerText>{player.remaining_time}s</WrapperTimerText>
      </WrapperTimerCircle>
    );
  };

  // Render dice
  const renderDice = (player) => {
    const isCurrent = currentPlayer?.login === player.login;
    
    return (
      <WrapperDiceIcon
        onClick={isCurrent && canRoll ? handleRollDice : undefined}
        style={{
          cursor: isCurrent && canRoll ? "pointer" : "default",
          opacity: isCurrent && canRoll ? 1 : 0.5,
          transform: isCurrent && canRoll ? "scale(1)" : "scale(0.9)",
          transition: "all 0.2s",
        }}
      >
        {diceRoll && isCurrent ? (
          <div style={{
            width: "100%", 
            height: "100%", 
            display: "flex",
            alignItems: "center", 
            justifyContent: "center",
            fontSize: 24, 
            fontWeight: "bold", 
            color: "#333"
          }}>
            {diceRoll}
          </div>
        ) : (
          <>
            <WrapperDiceDot className="top-left" />
            <WrapperDiceDot className="top-right" />
            <WrapperDiceDot className="bottom-left" />
            <WrapperDiceDot className="bottom-right" />
          </>
        )}
      </WrapperDiceIcon>
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
        >? </button>
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
                  <li>Игрок бросает кубик, чтобы передвигать фишки</li>
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
        
        <WrapperBoardContainer>
          {gameState.players.map((player, index) => (
            <WrapperPlayerSection 
              key={player.player_id} 
              position={["bottom-left", "top-left", "top-right", "bottom-right"][index]}
            >
              {renderTimer(player, ["left", "left", "right", "right"][index])}
              {renderDice(player)}
              <WrapperPlayerAvatar
                src={player.avatar || `https://i.pravatar.cc/150?img=${index + 1}`}
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
      </WrapperContainer>
    </BackgroundComponent>
  );
};

export default GamePlay;