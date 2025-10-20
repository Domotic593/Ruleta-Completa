// frontend/src/components/Estadisticas.js
import React from 'react';

const Estadisticas = ({ data }) => {
  return (
    <div className="estadisticas">
      <h2>Estadísticas Globales</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.total_usuarios || 0}</div>
          <div className="stat-label">Usuarios Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.total_giros || 0}</div>
          <div className="stat-label">Giros Realizados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.productos_activos || 0}</div>
          <div className="stat-label">Productos Activos</div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;