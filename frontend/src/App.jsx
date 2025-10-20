import React, { useState } from 'react';
import Ruleta from './components/Ruleta/Ruleta';
import AdminPanel from './components/Admin/AdminPanel';
import './styles/App.css';

function App() {
  const [currentView, setCurrentView] = useState('ruleta');

  return (
    <div className="App">
      <nav className="app-nav">
        <div className="nav-container">
          <h1 className="nav-logo">🎯 Ruleta App</h1>
          <div className="nav-links">
            <button 
              className={`nav-link ${currentView === 'ruleta' ? 'active' : ''}`}
              onClick={() => setCurrentView('ruleta')}
            >
              🎮 Jugar Ruleta
            </button>
            <button 
              className={`nav-link ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              ⚙️ Panel Admin
            </button>
          </div>
        </div>
      </nav>

      <main className="app-main">
        {currentView === 'ruleta' && <Ruleta />}
        {currentView === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}

export default App;