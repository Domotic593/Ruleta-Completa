// frontend/src/components/ProductosManager.js
// frontend/src/components/ProductosManager.tsx
import React, { useState } from 'react';
import { Producto } from '../types';

interface ProductosManagerProps {
  productos: Producto[];
  onUpdate: () => void;
}

interface FormData {  nombre: string;
  tipo: 'prize' | 'penalty' | 'bonus' | 'wildcard';
  puntos: number;
  stock: number;
  probabilidad: number;
  color: string;
}
 
const ProductosManager: React.FC<ProductosManagerProps> = ({ productos, onUpdate }) => {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tipo: 'prize',
    puntos: 0,
    stock: 1,
    probabilidad: 1.0,
    color: '#4CAF50'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({
          nombre: '',
          tipo: 'prize',
          puntos: 0,
          stock: 1,
          probabilidad: 1.0,
          color: '#4CAF50'
        });
        onUpdate();
      }
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productoId: number) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await fetch(`/api/admin/productos/${productoId}`, {
          method: 'DELETE'
        });
        onUpdate();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'puntos' || name === 'stock' ? parseInt(value) : 
              name === 'probabilidad' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="productos-manager">
      <h2>Gestión de Productos</h2>
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Nombre del Producto:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo:</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
            >
              <option value="prize">Premio</option>
              <option value="penalty">Penalización</option>
              <option value="bonus">Bonus</option>
              <option value="wildcard">Comodín</option>
            </select>
          </div>

          <div className="form-group">
            <label>Puntos:</label>
            <input
              type="number"
              name="puntos"
              value={formData.puntos}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Stock:</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Probabilidad:</label>
            <input
              type="number"
              name="probabilidad"
              value={formData.probabilidad}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Color:</label>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Agregar Producto'}
        </button>
      </form>

      <div className="productos-list">
        <h3>Productos Existentes ({productos.length})</h3>
        {productos.map(producto => (
          <div key={producto.id} className={`producto-item ${producto.tipo}`}>
            <div className="producto-info">
              <span className="producto-nombre">{producto.nombre}</span>
              <span className={`producto-tipo ${producto.tipo}`}>
                {producto.tipo}
              </span>
              <span className="producto-puntos">
                {producto.puntos > 0 ? '+' : ''}{producto.puntos} pts
              </span>
              <span className="producto-stock">Stock: {producto.stock}</span>
            </div>
            <div className="producto-actions">
              <span 
                className="delete-btn"
                onClick={() => handleDelete(producto.id)}
                title="Eliminar producto"
              >
                🗑️
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductosManager;