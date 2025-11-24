import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const GamePlay = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const gameId = searchParams.get("gameId");
  const myLogin = localStorage.getItem("login");

  const [showExit, setShowExit] = useState(false);
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

  // --- API Helper
  const makeRequest = useCallback(async (method, endpoint, data = null) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  // --- Fetch game state
  const fetchGameState = useCallback(async () => {
    if (!gameId) return;

    try {
      const response = await makeRequest('GET', `/game/${gameId}`);
      if (!response?.success) {
        return;
      }

      setGameState(response.data);
      setError(null);

      // Check winner
      try {
        const winnerRes = await makeRequest('GET', `/game/${gameId}/winner`);
        if (winnerRes?.success && winnerRes.data.winner) {
          setWinner(winnerRes.data.winner);
        }
      } catch (winnerErr) {}
    } catch (err) {
      setError(err.message);
    }
  }, [gameId, makeRequest]);

  // --- Polling game state
  useEffect(() => {
    if (!gameId) return;
    
    fetchGameState();
    pollRef.current = setInterval(() => {
      // Skip polling if auto-pass is in progress
      if (!isAutoPassingRef.current) {
        fetchGameState();
      }
    }, 1500);
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gameId, fetchGameState]);

  // --- Timer countdown + auto-pass when time reaches 0
  useEffect(() => {
    if (!gameState) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const currentPlayer = gameState.players.find(p => p.is_turn);
    if (!currentPlayer) return;

    // Initialize time remaining from current player
    timeRemainingRef.current = currentPlayer.remaining_time;

    timerRef.current = setInterval(() => {
      timeRemainingRef.current = Math.max(0, timeRemainingRef.current - 1);
      
      // Update UI with decremented time
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

      // Auto-pass when time reaches 0
      if (timeRemainingRef.current === 0) {
        clearInterval(timerRef.current);
        
        // 🔥 Debounce - prevent multiple auto-pass calls
        const now = Date.now();
        if (isAutoPassingRef.current || (now - lastAutoPassTimeRef.current) < 2000) {
          return;
        }
        
        isAutoPassingRef.current = true;
        lastAutoPassTimeRef.current = now;
        
        makeRequest('POST', `/game/pass`, {
          game_id: parseInt(gameId)
        }).then(res => {
          setDiceRoll(null);
          // 🔥 Wait 500ms before fetching to ensure server is ready
          return new Promise(resolve => setTimeout(resolve, 500)).then(() => fetchGameState());
        }).catch(err => {
          console.error('Auto-pass failed:', err);
          return new Promise(resolve => setTimeout(resolve, 500)).then(() => fetchGameState());
        }).finally(() => {
          isAutoPassingRef.current = false;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.players.find(p => p.is_turn)?.player_id, gameId, makeRequest, fetchGameState]);

  // --- Exit handler
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!gameId || !myLogin) return;
      const data = JSON.stringify({ game_id: parseInt(gameId), login: myLogin });
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon(`${API_BASE_URL}/game/${gameId}/leave`, blob);
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameId, myLogin]);

  // --- Roll Dice
  const handleRollDice = useCallback(async () => {
    if (loading || !gameState) return;
    const currentPlayer = gameState.players.find(p => p.is_turn);
    const myPlayer = gameState.players.find(p => p.login === myLogin);

    if (!currentPlayer || !myPlayer || myPlayer.player_id !== currentPlayer.player_id) {
      setError("Не ваша очередь");
      return;
    }

    if (diceRoll) {
      setError("Переместите лошадь перед повторным броском");
      return;
    }

    try {
      setLoading(true);
      const response = await makeRequest('POST', '/game/roll', { 
        game_id: parseInt(gameId) 
      });
      
      if (response?.success) {
        setDiceRoll(response.data.roll);
        setError(null);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchGameState();
      } else {
        const errorMsg = response?.message || 'Не удалось бросить кости';
        setError(errorMsg);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId, gameState, myLogin, diceRoll, loading, makeRequest, fetchGameState]);

  // --- Move Horse
  const handleMoveHorse = useCallback(async (horseId) => {
    if (isMoving || !gameState || !diceRoll) {
      return false;
    }
    const currentPlayer = gameState.players.find(p => p.is_turn);
    if (!currentPlayer || currentPlayer.login !== myLogin) {
      setError("Не ваша очередь");
      return false;
    }
    setIsMoving(true);
    setError(null);
    try {
      const response = await makeRequest('POST', '/game/move', {
        game_id: parseInt(gameId),
        horse_id: horseId
      });

      if (response?.success) {
        setDiceRoll(null);
        setError(null);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchGameState();

        try {
          const winnerRes = await makeRequest('GET', `/game/${gameId}/winner`);
          if (winnerRes?.success && winnerRes.data.winner) {
            setWinner(winnerRes.data.winner);
          }
        } catch (e) {}

        setIsMoving(false);
        return true;
      } else {
        setError(response?.message || 'Ход не выполнен');
        setIsMoving(false);
        return false;
      }
    } catch (err) {
      setError(err.message);
      setIsMoving(false);
      return false;
    }
  }, [gameId, isMoving, gameState, myLogin, diceRoll, makeRequest, fetchGameState]);

  // --- Exit
  const handleExit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    isAutoPassingRef.current = false;
    lastAutoPassTimeRef.current = 0;

    if (gameId && myLogin) {
      makeRequest('POST', `/game/${gameId}/leave`, {})
        .catch(err => {});
    }

    navigate("/ludohome");
  }, [navigate, gameId, myLogin, makeRequest]);

  // --- Winner screen
  if (winner) {
    return (
      <BackgroundComponent opacity={0.95}>
        <WrapperContainer>
          <div style={{ color: "white", fontSize: 32, textAlign: "center" }}>
            <h1>Игрок {winner.toUpperCase()} победил!</h1>
            <button
              onClick={handleExit}
              style={{ 
                marginTop: 20, 
                padding: "10px 30px", 
                fontSize: 16, 
                cursor: "pointer",
                backgroundColor: "#FFD700",
                border: "none",
                borderRadius: "5px",
                fontWeight: "bold"
              }}
            >
              На главную
            </button>
          </div>
        </WrapperContainer>
      </BackgroundComponent>
    );
  }

  // --- Loading screen
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

  // --- Determine current state
  const currentPlayer = gameState.players.find(p => p.is_turn);
  const isMyTurn = currentPlayer?.login === myLogin;
  
  const hasRolled = !!diceRoll;
  const canRoll = isMyTurn && !hasRolled && !loading;
  const canMove = isMyTurn && hasRolled && !isMoving;

  // --- Render timer
  const renderTimer = (player, position) => {
    if (!player.is_turn) return null;
    const percentage = (player.remaining_time / gameState.step_time) * 100;
    return (
      <WrapperTimerCircle percentage={percentage} position={position}>
        <WrapperTimerText>{player.remaining_time}s</WrapperTimerText>
      </WrapperTimerCircle>
    );
  };

  // --- Render dice
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

        <WrapperBoardContainer>
          {gameState.players.map((player, index) => (
            <WrapperPlayerSection 
              key={player.player_id} 
              position={["bottom-left", "top-left", "top-right", "bottom-right"][index]}
            >
              {renderDice(player)}
              {renderTimer(player, ["left", "left", "right", "right"][index])}
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