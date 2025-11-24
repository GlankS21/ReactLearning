import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const useGameAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  const makeRequest = useCallback(async (method, endpoint, data = null) => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Content-Type': 'application/json',
      };

      const token = getToken();
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
      setError(err.message);
      console.error('API Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startGame = useCallback((gameId) => {
    return makeRequest('POST', '/game/start', { game_id: gameId });
  }, [makeRequest]);

  const rollDice = useCallback((gameId) => {
    return makeRequest('POST', '/game/roll', { game_id: gameId });
  }, [makeRequest]);

  const moveHorse = async (gameId, horseId, force = false) => {
  try {
    const response = await fetch('/api/game/move-horse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameId, horse_id: horseId, force_move: force }),
    });

    const data = await response.json();

    // Если сервер сказал "Not your turn", но мы уверены — попробуем один раз принудительно
    if (!data.success && data.message === 'Not your turn') {
      // Повторная попытка с force_move: true
      const retryResponse = await fetch('/api/game/move-horse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, horse_id: horseId, force_move: true }),
      });
      return await retryResponse.json();
    }

    return data;
  } catch (err) {
    console.error("moveHorse error:", err);
    return { success: false };
  }
};


  const getGameState = useCallback((gameId) => {
    return makeRequest('GET', `/game/${gameId}`);
  }, [makeRequest]);

  const checkWinner = useCallback((gameId) => {
    return makeRequest('GET', `/game/${gameId}/winner`);
  }, [makeRequest]);

  return {
    loading,
    error,
    startGame,
    rollDice,
    moveHorse,
    getGameState,
    checkWinner,
  };
};