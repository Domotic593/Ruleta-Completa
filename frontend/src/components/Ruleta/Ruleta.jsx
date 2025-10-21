import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Ruleta.css';

const Ruleta = () => {
    const [items, setItems] = useState([]);
    const [puntos, setPuntos] = useState(100);
    const [isSpinning, setIsSpinning] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [userId] = useState(() => {
        let id = localStorage.getItem('ruleta_user_id');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ruleta_user_id', id);
        }
        return id;
    });

    const wheelRef = useRef(null);
    const wheelContainerRef = useRef(null);

    // Colores por tipo de premio
    const segmentColors = {
        'prize': ['#4CAF50', '#45a049'],
        'penalty': ['#F44336', '#d32f2f'],
        'bonus': ['#2196F3', '#1976D2'],
        'wildcard': ['#FFC107', '#FFA000']
    };

    const resultColors = {
        'prize': '#27ae60',
        'penalty': '#e74c3c',
        'bonus': '#3498db',
        'wildcard': '#f39c12'
    };

    // Cargar items de la ruleta
    useEffect(() => {
        cargarItems();
        cargarDatosUsuario();
    }, []);

    const cargarItems = async () => {
        try {
            console.log('🔄 Cargando items desde el backend...');
            const response = await axios.get('/api/ruleta/items');
            console.log('✅ Items cargados:', response.data);
            
            const itemsData = response.data.items || [];
            setItems(itemsData);
            
            // Si no hay items, usar datos de ejemplo
            if (itemsData.length === 0) {
                console.log('⚠️ No hay items, usando datos de ejemplo');
                setItems(getDefaultItems());
            }
        } catch (error) {
            console.error('❌ Error cargando items:', error);
            console.log('🔄 Usando datos de ejemplo por fallo en el backend');
            setItems(getDefaultItems());
        }
    };

    const getDefaultItems = () => {
        return [
            { id: 1, nombre: "Premio Mayor", tipo: "prize", puntos: 100, color: "#FFD700" },
            { id: 2, nombre: "Viaje", tipo: "prize", puntos: 80, color: "#4CAF50" },
            { id: 3, nombre: "Tarjeta $50", tipo: "prize", puntos: 60, color: "#2196F3" },
            { id: 4, nombre: "Descuento 20%", tipo: "prize", puntos: 40, color: "#9C27B0" },
            { id: 5, nombre: "Pierdes Turno", tipo: "penalty", puntos: -10, color: "#F44336" },
            { id: 6, nombre: "Giro Extra", tipo: "bonus", puntos: 0, color: "#FF9800" },
            { id: 7, nombre: "Bonus", tipo: "bonus", puntos: 20, color: "#00BCD4" },
            { id: 8, nombre: "Suerte!", tipo: "wildcard", puntos: 30, color: "#E91E63" },
        ];
    };

    const cargarDatosUsuario = async () => {
        const puntosGuardados = localStorage.getItem('user_points');
        if (puntosGuardados) {
            setPuntos(parseInt(puntosGuardados));
        }
    };

    // FUNCIÓN GIRAR RULETA CORREGIDA (SOLO UNA VEZ)
    const girarRuleta = async () => {
        if (isSpinning || items.length === 0) return;
        
        setIsSpinning(true);
        setResultado(null);

        // Efecto visual de giro
        if (wheelContainerRef.current) {
            wheelContainerRef.current.classList.add('wheel-spinning');
        }

        try {
            console.log('🔄 Enviando petición de giro...');
            const response = await axios.post('/api/ruleta/girar', {
                user_id: userId
            });

            console.log('✅ Respuesta del backend:', response.data);
            const data = response.data;
            
            // Animar la ruleta
            await animarRuleta(data.resultado);
            
            setResultado(data.resultado);
            setPuntos(data.puntos_actuales);
            localStorage.setItem('user_points', data.puntos_actuales.toString());

            // Efecto de sonido según el tipo
            playResultSound(data.resultado.tipo);

        } catch (error) {
            console.error('❌ Error al girar ruleta:', error);
            
            // Mostrar más detalles del error
            if (error.response) {
                // El servidor respondió con un código de error
                console.error('📊 Datos del error:', error.response.data);
                console.error('🔢 Status code:', error.response.status);
                alert(`Error ${error.response.status}: ${error.response.data.error || 'Error del servidor'}`);
            } else if (error.request) {
                // No se recibió respuesta
                console.error('🌐 Error de conexión:', error.request);
                alert('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:5000');
            } else {
                // Error en la configuración
                console.error('⚙️ Error de configuración:', error.message);
                alert('Error de configuración: ' + error.message);
            }
        } finally {
            setIsSpinning(false);
            if (wheelContainerRef.current) {
                wheelContainerRef.current.classList.remove('wheel-spinning');
            }
        }
    };

    const animarRuleta = (premio) => {
        return new Promise((resolve) => {
            const wheel = wheelRef.current;
            if (!wheel) {
                resolve();
                return;
            }

            // Encontrar el índice del premio ganador
            const winningIndex = items.findIndex(item => 
                item.id === premio.id || item.nombre === premio.nombre
            );

            if (winningIndex === -1) {
                resolve();
                return;
            }

            // Calcular la animación
            const segmentAngle = 360 / items.length;
            const fullRotations = 5;
            const randomOffset = Math.random() * (segmentAngle - 10) + 5;
            const targetAngle = winningIndex * segmentAngle + randomOffset;
            const totalRotation = fullRotations * 360 + (360 - targetAngle);

            // Resetear transición para animación suave
            wheel.style.transition = 'none';
            wheel.style.transform = `rotate(0deg)`;
            
            // Forzar reflow
            void wheel.offsetWidth;
            
            // Aplicar nueva animación
            wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.2, 1)';
            wheel.style.transform = `rotate(${totalRotation}deg)`;

            // Esperar a que termine la animación
            const onTransitionEnd = () => {
                wheel.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };

            wheel.addEventListener('transitionend', onTransitionEnd);
        });
    };

    const playResultSound = (tipo) => {
        // Simular efectos de sonido
        const soundMessages = {
            'prize': '🎉 Sonido de victoria!',
            'penalty': '⚠️ Sonido de penalización',
            'bonus': '✨ Sonido de bono',
            'wildcard': '🎴 Sonido de comodín'
        };
        console.log(soundMessages[tipo] || '🔊 Efecto de sonido');
    };

    const getTipoTexto = (tipo) => {
        const tipos = {
            'prize': 'Premio',
            'penalty': 'Penalización', 
            'bonus': 'Bonus',
            'wildcard': 'Comodín'
        };
        return tipos[tipo] || tipo;
    };

    // Función auxiliar para calcular puntos en el círculo
    const getPointInCircle = (angle, radiusPercent, centerX, centerY) => {
        const x = centerX + radiusPercent * Math.cos((angle - 90) * Math.PI / 180);
        const y = centerY + radiusPercent * Math.sin((angle - 90) * Math.PI / 180);
        return `${x}% ${y}%`;
    };

    // Crear segmentos de la ruleta - VERSIÓN SIMPLIFICADA Y FUNCIONAL
    const createWheelSegments = () => {
        if (items.length === 0) {
            return <div className="no-items">Cargando premios...</div>;
        }

        const segmentAngle = 360 / items.length;
        
        return items.map((item, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;

            // Calcular puntos para el clip-path
            const centerX = 50;
            const centerY = 50;
            const radius = 50;

            let clipPathPoints = [`${centerX}% ${centerY}%`];
            const numArcPoints = Math.max(2, Math.ceil(segmentAngle / 10));

            for (let i = 0; i <= numArcPoints; i++) {
                const currentAngle = startAngle + (segmentAngle / numArcPoints) * i;
                clipPathPoints.push(getPointInCircle(currentAngle, radius, centerX, centerY));
            }

            // Posición del texto
            const textCenterAngle = startAngle + (segmentAngle / 2);
            const textRadiusOffset = 35;
            const textX = centerX + textRadiusOffset * Math.cos((textCenterAngle - 90) * Math.PI / 180);
            const textY = centerY + textRadiusOffset * Math.sin((textCenterAngle - 90) * Math.PI / 180);
            const textRotationAdjusted = textCenterAngle + 90;

            return (
                <div 
                    key={item.id}
                    className={`segment ${item.tipo}`}
                    style={{
                        clipPath: `polygon(${clipPathPoints.join(',')})`,
                        background: `linear-gradient(45deg, ${segmentColors[item.tipo]?.[0] || '#666'}, ${segmentColors[item.tipo]?.[1] || '#555'})`
                    }}
                >
                    <div 
                        className="segment-text"
                        style={{
                            left: `${textX}%`,
                            top: `${textY}%`,
                            transform: `translate(-50%, -50%) rotate(${textRotationAdjusted}deg)`
                        }}
                    >
                        {item.nombre}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="ruleta-container">
            <div className="ruleta-header">
                <h2>🎯 Ruleta de Premios</h2>
                <div className="puntos-display">
                    <span className="puntos">{puntos}</span> puntos disponibles
                </div>
            </div>

            <div className="wheel-container-wrapper">
                <div 
                    ref={wheelContainerRef}
                    className="wheel-container"
                >
                    <div 
                        ref={wheelRef}
                        className="wheel"
                    >
                        {createWheelSegments()}
                    </div>
                    <div className="spinner"></div>
                </div>

                <button 
                    className={`spin-button ${isSpinning ? 'spinning' : ''}`}
                    onClick={girarRuleta}
                    disabled={isSpinning || items.length === 0}
                >
                    {isSpinning ? '🎰 Girando...' : `🎮 Girar Ruleta`}
                </button>

                {resultado && (
                    <div 
                        className={`result-display ${resultado.tipo}`}
                        style={{ color: resultColors[resultado.tipo] }}
                    >
                        <div className="result-content">
                            <h3>🎉 ¡Felicidades!</h3>
                            <div className="premio-ganado">
                                <strong>{resultado.nombre}</strong>
                            </div>
                            <div className="puntos-cambio">
                                Puntos: {resultado.puntos >= 0 ? '+' : ''}{resultado.puntos}
                            </div>
                            <div className="puntos-totales">
                                Total: {puntos} puntos
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="items-lista">
                <h4>Premios Disponibles:</h4>
                <div className="items-grid">
                    {items.map(item => (
                        <div 
                            key={item.id} 
                            className="item-card"
                            style={{ 
                                borderLeftColor: segmentColors[item.tipo]?.[0] || '#666',
                                background: `linear-gradient(135deg, ${segmentColors[item.tipo]?.[0] || '#666'}20, ${segmentColors[item.tipo]?.[1] || '#555'}20)`
                            }}
                        >
                            <div className="item-nombre">{item.nombre}</div>
                            <div className="item-info">
                                <span className="item-tipo">{getTipoTexto(item.tipo)}</span>
                                <span className="item-puntos">{item.puntos >= 0 ? '+' : ''}{item.puntos} pts</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Ruleta;