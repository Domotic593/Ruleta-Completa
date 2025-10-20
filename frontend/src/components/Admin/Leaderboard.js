// frontend/src/components/Leaderboard.js
import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Por ahora, simulamos datos. En producción, conectarías con la API
      const mockData = [
        { user_id: 'user_001', puntos: 450, nivel: 5, giros_realizados: 25 },
        { user_id: 'user_002', puntos: 380, nivel: 4, giros_realizados: 20 },
        { user_id: 'user_003', puntos: 320, nivel: 4, giros_realizados: 18 },
        { user_id: 'user_004', puntos: 290, nivel: 3, giros_realizados: 15 },
        { user_id: 'user_005', puntos: 250, nivel: 3, giros_realizados: 12 }
      ];
      setLeaderboard(mockData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando leaderboard...</div>;
  }

  return (
    <div className="leaderboard">
      <h2>🏆 Top Jugadores</h2>
      <div className="leaderboard-list">
        {leaderboard.map((user, index) => (
          <div key={user.user_id} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
            <div className="rank">#{index + 1}</div>
            <div className="user-info">
              <div className="user-id">{user.user_id}</div>
              <div className="user-stats">
                <span className="points">{user.puntos} pts</span>
                <span className="level">Nvl {user.nivel}</span>
              </div>
            </div>
            <div className="giros">{user.giros_realizados} giros</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;