import React, { useState, useEffect } from 'react';
import './Ruleta.css';

const Ruleta = () => {
  const [items, setItems] = useState([]);
  const [puntos, setPuntos] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [rotation, setRotation] = useState(0);

  const userId = localStorage.getItem('ruleta_user_id') || 
                 'user_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (!localStorage.getItem('ruleta_user_id')) {
      localStorage.setItem('ruleta_user_id', userId);
    }
    cargarItems();
    cargarPuntosUsuario();
  }, []);

  const cargarItems = async () => {
    try {
      const response = await fetch('/api/ruleta/items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error cargando items:', error);
      setItems([
        { id: 1, text: "Premio Mayor", type: "prize", puntos: 100, color: "#FFD700" },
        { id: 2, text: "Viaje a la Playa", type: "prize", puntos: 80, color: "#4CAF50" },
        { id: 3, text: "Tarjeta Regalo $50", type: "prize", puntos: 60, color: "#2196F3" },
        { id: 4, text: "Pierdes Turno", type: "penalty", puntos: -10, color: "#F44336" },
        { id: 5, text: "Giro Extra", type: "bonus", puntos: 0, color: "#9C27B0" },
      ]);
    }
  };

  const cargarPuntosUsuario = () => {
    const puntosGuardados = localStorage.getItem('user_points');
    if (puntosGuardados) {
      setPuntos(parseInt(puntosGuardados));
    }
  };

  const girarRuleta = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setResultado(null);

    try {
      const response = await fetch('/api/ruleta/girar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setResultado({ tipo: 'error', mensaje: data.error });
        return;
      }

      const winningIndex = items.findIndex(item => 
        item.text === data.resultado.text
      );
      
      await animarRuleta(winningIndex);
      
      setPuntos(data.puntos_actuales);
      localStorage.setItem('user_points', data.puntos_actuales.toString());
      setResultado({
        tipo: 'exito',
        producto: data.resultado,
        puntosGanados: data.resultado.puntos,
        puntosTotales: data.puntos_actuales
      });

    } catch (error) {
      console.error('Error al girar ruleta:', error);
      setResultado({ 
        tipo: 'error', 
        mensaje: 'Error de conexión. Intenta nuevamente.' 
      });
    } finally {
      setIsSpinning(false);
    }
  };

  const animarRuleta = (winningIndex) => {
    return new Promise((resolve) => {
      const segmentAngle = 360 / items.length;
      const fullRotations = 5;
      const randomOffset = Math.random() * (segmentAngle - 10) + 5;
      const targetAngle = winningIndex * segmentAngle + randomOffset;
      const totalRotation = fullRotations * 360 + (360 - targetAngle);

      setRotation(totalRotation);

      setTimeout(() => {
        resolve();
      }, 4000);
    });
  };

  return (
    <div className="ruleta-container">
      <header className="ruleta-header">
        <h1>🎯 Ruleta de Premios</h1>
        <div className="user-info">
          <div className="points-display">
            <span>{puntos}</span> puntos
          </div>
        </div>
      </header>

      <main className="ruleta-main">
        <div className="wheel-wrapper">
          <div 
            className="wheel-container"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.2, 1)' : 'none'
            }}
          >
            {items.map((item, index) => {
              const angle = (360 / items.length) * index;
              const segmentAngle = 360 / items.length;
              
              return (
                <div
                  key={item.id}
                  className="wheel-segment"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    backgroundColor: item.color || '#4CAF50',
                    clipPath: `polygon(50% 50%, 50% 0%, ${
                      50 + 50 * Math.cos((angle + segmentAngle / 2) * Math.PI / 180)
                    }% ${
                      50 + 50 * Math.sin((angle + segmentAngle / 2) * Math.PI / 180)
                    }%)`
                  }}
                >
                  <div 
                    className="segment-text"
                    style={{
                      transform: `rotate(${angle + 90}deg)`
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })}
            <div className="wheel-center"></div>
          </div>
          <div className="spinner"></div>
        </div>

        <button 
          className={`spin-button ${isSpinning ? 'spinning' : ''}`}
          onClick={girarRuleta}
          disabled={isSpinning}
        >
          {isSpinning ? 'GIRANDO...' : `GIRAR RULETA (${puntos} pts)`}
        </button>

        {resultado && (
          <div className={`resultado ${resultado.tipo}`}>
            {resultado.tipo === 'error' ? (
              <div>
                <h3>⚠️ Error</h3>
                <p>{resultado.mensaje}</p>
              </div>
            ) : (
              <div>
                <h3>🎉 ¡Felicidades! 🎉</h3>
                <p className="premio-ganado">{resultado.producto.text}</p>
                <p className="puntos-info">
                  Puntos: <strong>{resultado.puntosGanados >= 0 ? '+' : ''}{resultado.puntosGanados}</strong>
                </p>
                <p className="puntos-totales">
                  Total: <strong>{resultado.puntosTotales} puntos</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Ruleta;