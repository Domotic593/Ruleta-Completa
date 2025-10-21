import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
    const [productos, setProductos] = useState([]);
    const [nuevoProducto, setNuevoProducto] = useState({
        nombre: '',
        tipo: 'prize',
        puntos: 0,
        stock: 1,
        probabilidad: 1.0,
        color: '#4CAF50'
    });
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            setCargando(true);
            const response = await axios.get('/api/admin/productos');
            setProductos(response.data);
        } catch (error) {
            console.error('Error cargando productos:', error);
            alert('❌ Error cargando productos. Verifica que el backend esté corriendo.');
        } finally {
            setCargando(false);
        }
    };

    const crearProducto = async () => {
        if (!nuevoProducto.nombre.trim()) {
            alert('⚠️ El nombre del producto es requerido');
            return;
        }

        try {
            await axios.post('/api/admin/productos', nuevoProducto);
            setNuevoProducto({
                nombre: '',
                tipo: 'prize',
                puntos: 0,
                stock: 1,
                probabilidad: 1.0,
                color: '#4CAF50'
            });
            cargarProductos();
            alert('✅ Producto creado exitosamente!');
        } catch (error) {
            console.error('Error creando producto:', error);
            alert('❌ Error creando producto');
        }
    };

    const eliminarProducto = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }

        try {
            await axios.delete(`/api/admin/productos/${id}`);
            cargarProductos();
            alert('✅ Producto eliminado!');
        } catch (error) {
            console.error('Error eliminando producto:', error);
            alert('❌ Error eliminando producto');
        }
    };

    const cargarProductosEjemplo = async () => {
        if (!window.confirm('¿Cargar productos de ejemplo? Esto agregará 5 productos predeterminados.')) {
            return;
        }

        const productosEjemplo = [
            { 
                nombre: "🎁 Premio Mayor", 
                tipo: "prize", 
                puntos: 100, 
                stock: 5, 
                probabilidad: 0.05, 
                color: "#FFD700" 
            },
            { 
                nombre: "🏖️ Viaje a la Playa", 
                tipo: "prize", 
                puntos: 80, 
                stock: 3, 
                probabilidad: 0.08, 
                color: "#4CAF50" 
            },
            { 
                nombre: "💳 Tarjeta Regalo $50", 
                tipo: "prize", 
                puntos: 60, 
                stock: 10, 
                probabilidad: 0.1, 
                color: "#2196F3" 
            },
            { 
                nombre: "⏸️ Pierdes Turno", 
                tipo: "penalty", 
                puntos: -10, 
                stock: 999, 
                probabilidad: 0.15, 
                color: "#F44336" 
            },
            { 
                nombre: "🔄 Giro Extra", 
                tipo: "bonus", 
                puntos: 0, 
                stock: 5, 
                probabilidad: 0.07, 
                color: "#9C27B0" 
            },
        ];

        try {
            setCargando(true);
            for (const producto of productosEjemplo) {
                await axios.post('/api/admin/productos', producto);
            }
            cargarProductos();
            alert('✅ Productos de ejemplo cargados exitosamente!');
        } catch (error) {
            console.error('Error cargando productos ejemplo:', error);
            alert('❌ Error cargando productos de ejemplo');
        } finally {
            setCargando(false);
        }
    };

    const limpiarProductos = async () => {
        if (!window.confirm('⚠️ ¿ESTÁS SEGURO? Esto eliminará TODOS los productos permanentemente.')) {
            return;
        }

        try {
            setCargando(true);
            // Eliminar todos los productos uno por uno
            for (const producto of productos) {
                await axios.delete(`/api/admin/productos/${producto.id}`);
            }
            cargarProductos();
            alert('🗑️ Todos los productos han sido eliminados');
        } catch (error) {
            console.error('Error eliminando productos:', error);
            alert('❌ Error eliminando productos');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="admin-panel">
            <h2>⚙️ Panel de Administración</h2>
            
            {/* Sección de acciones rápidas */}
            <div className="admin-section">
                <h3>🚀 Acciones Rápidas</h3>
                <div className="acciones-rapidas">
                    <button 
                        onClick={cargarProductosEjemplo} 
                        className="btn-primary"
                        disabled={cargando}
                    >
                        {cargando ? '⏳ Cargando...' : '📦 Cargar Productos de Ejemplo'}
                    </button>
                    
                    {productos.length > 0 && (
                        <button 
                            onClick={limpiarProductos} 
                            className="btn-danger"
                            disabled={cargando}
                        >
                            🗑️ Limpiar Todos los Productos
                        </button>
                    )}
                    
                    <button 
                        onClick={cargarProductos} 
                        className="btn-secondary"
                        disabled={cargando}
                    >
                        🔄 Actualizar Lista
                    </button>
                </div>
            </div>

            {/* Sección para crear nuevo producto */}
            <div className="admin-section">
                <h3>➕ Crear Nuevo Producto</h3>
                <div className="producto-form">
                    <div className="form-group">
                        <label>Nombre del Producto:</label>
                        <input
                            type="text"
                            placeholder="Ej: Premio Especial"
                            value={nuevoProducto.nombre}
                            onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo:</label>
                        <select
                            value={nuevoProducto.tipo}
                            onChange={(e) => setNuevoProducto({...nuevoProducto, tipo: e.target.value})}
                        >
                            <option value="prize">🎁 Premio</option>
                            <option value="penalty">⚠️ Penalización</option>
                            <option value="bonus">✨ Bonus</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Puntos:</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={nuevoProducto.puntos}
                            onChange={(e) => setNuevoProducto({...nuevoProducto, puntos: parseInt(e.target.value) || 0})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Stock:</label>
                        <input
                            type="number"
                            placeholder="1"
                            value={nuevoProducto.stock}
                            onChange={(e) => setNuevoProducto({...nuevoProducto, stock: parseInt(e.target.value) || 1})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Probabilidad (0.01 - 1.0):</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="1.0"
                            placeholder="1.0"
                            value={nuevoProducto.probabilidad}
                            onChange={(e) => setNuevoProducto({...nuevoProducto, probabilidad: parseFloat(e.target.value) || 1.0})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Color:</label>
                        <div className="color-picker">
                            <input
                                type="color"
                                value={nuevoProducto.color}
                                onChange={(e) => setNuevoProducto({...nuevoProducto, color: e.target.value})}
                            />
                            <span>{nuevoProducto.color}</span>
                        </div>
                    </div>

                    <button 
                        onClick={crearProducto} 
                        disabled={!nuevoProducto.nombre.trim() || cargando}
                        className="btn-success"
                    >
                        {cargando ? '⏳ Creando...' : '✅ Crear Producto'}
                    </button>
                </div>
            </div>

            {/* Sección de productos existentes */}
            <div className="admin-section">
                <h3>📋 Productos Existentes ({productos.length})</h3>
                
                {cargando ? (
                    <div className="cargando">⏳ Cargando productos...</div>
                ) : productos.length === 0 ? (
                    <div className="sin-productos">
                        <p>📭 No hay productos cargados.</p>
                        <p>Usa el botón "Cargar Productos de Ejemplo" para empezar.</p>
                    </div>
                ) : (
                    <div className="productos-lista">
                        {productos.map(producto => (
                            <div key={producto.id} className="producto-item">
                                <div 
                                    className="producto-color" 
                                    style={{ backgroundColor: producto.color }}
                                ></div>
                                <div className="producto-info">
                                    <strong>{producto.nombre}</strong>
                                    <div className="producto-detalles">
                                        <span className={`badge tipo-${producto.tipo}`}>
                                            {producto.tipo === 'prize' ? '🎁 Premio' : 
                                             producto.tipo === 'penalty' ? '⚠️ Penalización' : '✨ Bonus'}
                                        </span>
                                        <span>🔄 Prob: {producto.probabilidad}</span>
                                        <span>📦 Stock: {producto.stock}</span>
                                        <span>⭐ Puntos: {producto.puntos}</span>
                                        <span>🎨 {producto.color}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => eliminarProducto(producto.id)}
                                    className="btn-danger"
                                    disabled={cargando}
                                >
                                    🗑️ Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;