// frontend/src/App.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import Ruleta from './components/Ruleta/Ruleta';
import PanelAdmin from './components/Admin Ruleta/PanelAdmin';
import ProductosManager from './components/ProductosManager';
import Estadisticas from './components/Admin Ruleta/Estadisticas';
import Leaderboard from './components/Admin Ruleta/Leaderboard';
import './styles/App.css';

function App() {
  const [currentView, setCurrentView] = useState('ruleta');
  const [productos, setProductos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [prodRes, statsRes] = await Promise.all([
        fetch('/api/admin/productos'),
        fetch('/api/admin/estadisticas')
      ]);
      
      if (prodRes.ok) {
        const productosData = await prodRes.json();
        setProductos(productosData);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setEstadisticas(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // En caso de error, usar datos de ejemplo
      const mockProductos = [
        { id: 1, nombre: "Premio Mayor", tipo: "prize", puntos: 100, stock: 5 },
        { id: 2, nombre: "Giro Extra", tipo: "bonus", puntos: 0, stock: 10 }
      ];
      setProductos(mockProductos);
      setEstadisticas({
        total_usuarios: 0,
        total_giros: 0,
        productos_activos: 2
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="App">
        <nav className="aap-nav">
          <ul>
            <li>  
              <button onClick={() => setCurrentView('ruleta')} className="nav-button">
                Ruleta
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('admin')} className="nav-button">
                Admin
              </button>
            </li>
          </ul>
        </nav>  

        <header className="app-header">
          <h1>🎯 Panel de Administración - Ruleta</h1>
          <p>Gestiona productos y visualiza estadísticas</p>
          <button onClick={fetchData} className="refresh-btn">
            🔄 Actualizar
          </button>
        </header>

        <div className="dashboard">
          <div className="dashboard-row">
            <div className="dashboard-col">
              <ProductosManager 
                productos={productos} 
                onUpdate={fetchData} 
              />
            </div>
            <div className="dashboard-col">
              <Estadisticas data={estadisticas} />
            </div>
          </div>
          <div className="dashboard-row">
            <div className="dashboard-col">
              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <nav className="aap-nav">
        <ul>
          <li>  
            <button onClick={() => setCurrentView('ruleta')} className="nav-button">
              Ruleta
            </button>
          </li>
          <li>
            <button onClick={() => setCurrentView('admin')} className="nav-button">
              Admin
            </button>
          </li>
        </ul>
      </nav>  
      {currentView === 'ruleta' && <Ruleta />}
      {currentView === 'admin' && <PanelAdmin />}
    </div>  
  );
}