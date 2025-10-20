# backend/app.py

from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
# Importar modelos
from models import db, Producto, Usuario, PremioObtenido
from datetime import datetime
import random
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ruleta.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'clave-secreta-ruleta-2024'

# Configurar CORS para React
CORS(app)

# Inicializar base de datos
db.init_app(app)

class RuletaManager:
    def get_productos_activos(self):
        return Producto.query.filter_by(activo=True).all()
    
    def calcular_probabilidades(self, productos):
        if not productos:
            return []
            
        total_probabilidad = sum(p.probabilidad for p in productos)
        productos_con_prob = []
        
        for producto in productos:
            prob_normalizada = producto.probabilidad / total_probabilidad
            productos_con_prob.append({
                'producto': producto,
                'probabilidad': prob_normalizada
            })
        
        return productos_con_prob
    
    def seleccionar_producto(self, productos_con_prob):
        if not productos_con_prob:
            return None
            
        rand = random.random()
        acumulado = 0
        
        for item in productos_con_prob:
            acumulado += item['probabilidad']
            if rand <= acumulado:
                return item['producto']
        
        return productos_con_prob[-1]['producto']

ruleta_manager = RuletaManager()

# Ruta principal - Sirve la ruleta
@app.route('/')
def index():
    return render_template('index.html')

# API PARA LA RULETA PRINCIPAL
@app.route('/api/ruleta/items')
def get_ruleta_items():
    """Obtiene items para la ruleta principal"""
    try:
        productos = ruleta_manager.get_productos_activos()
        items = [p.to_dict() for p in productos] if productos else []
        return jsonify({'items': items})
    except Exception as e:
        print(f"Error getting ruleta items: {e}")
        return jsonify({'items': []})

@app.route('/api/ruleta/girar', methods=['POST'])
def girar_ruleta():
    """Procesa un giro de ruleta"""
    try:
        data = request.json
        user_id = data.get('user_id', 'anonymous')
        
        # Verificar/Crear usuario
        usuario = Usuario.query.get(user_id)
        if not usuario:
            usuario = Usuario(id=user_id, puntos=100)
            db.session.add(usuario)
        
        # Obtener productos activos
        productos = ruleta_manager.get_productos_activos()
        if not productos:
            return jsonify({'error': 'No hay productos disponibles'}), 400
        
        # Calcular probabilidades y seleccionar ganador
        productos_con_prob = ruleta_manager.calcular_probabilidades(productos)
        producto_ganador = ruleta_manager.seleccionar_producto(productos_con_prob)
        
        if not producto_ganador:
            return jsonify({'error': 'Error al seleccionar producto'}), 400
        
        # Actualizar usuario
        usuario.puntos += producto_ganador.puntos
        usuario.giros_realizados += 1
        usuario.ultimo_giro = datetime.now()
        
        # Registrar premio
        premio = PremioObtenido(usuario_id=user_id, producto_id=producto_ganador.id)
        db.session.add(premio)
        
        # Actualizar stock
        if producto_ganador.stock > 0:
            producto_ganador.stock -= 1
            if producto_ganador.stock == 0:
                producto_ganador.activo = False
        
        db.session.commit()
        
        return jsonify({
            'resultado': producto_ganador.to_dict(),
            'puntos_actuales': usuario.puntos,
            'user_id': user_id
        })
        
    except Exception as e:
        print(f"Error in girar_ruleta: {e}")
        db.session.rollback()
        return jsonify({'error': 'Error interno del servidor'}), 500

# API PARA ADMINISTRACIÓN
@app.route('/api/admin/productos', methods=['GET', 'POST'])
def administrar_productos():
    if request.method == 'GET':
        try:
            productos = Producto.query.all()
            productos_list = [p.to_dict() for p in productos] if productos else []
            return jsonify(productos_list)
        except Exception as e:
            print(f"Error getting productos: {e}")
            return jsonify([])
    
    elif request.method == 'POST':
        try:
            data = request.json
            producto = Producto(
                nombre=data['nombre'],
                tipo=data['tipo'],
                puntos=data['puntos'],
                stock=data.get('stock', 1),
                probabilidad=data.get('probabilidad', 1.0),
                color=data.get('color', '#4CAF50')
            )
            db.session.add(producto)
            db.session.commit()
            return jsonify(producto.to_dict())
        except Exception as e:
            print(f"Error creating product: {e}")
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

@app.route('/api/admin/productos/<int:producto_id>', methods=['PUT', 'DELETE'])
def administrar_producto(producto_id):
    try:
        producto = Producto.query.get_or_404(producto_id)
        
        if request.method == 'PUT':
            data = request.json
            producto.nombre = data.get('nombre', producto.nombre)
            producto.tipo = data.get('tipo', producto.tipo)
            producto.puntos = data.get('puntos', producto.puntos)
            producto.stock = data.get('stock', producto.stock)
            producto.probabilidad = data.get('probabilidad', producto.probabilidad)
            producto.color = data.get('color', producto.color)
            producto.activo = data.get('activo', producto.activo)
            db.session.commit()
            return jsonify(producto.to_dict())
        
        elif request.method == 'DELETE':
            db.session.delete(producto)
            db.session.commit()
            return jsonify({'message': 'Producto eliminado'})
            
    except Exception as e:
        print(f"Error in administrar_producto: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/estadisticas')
def get_estadisticas():
    try:
        total_usuarios = Usuario.query.count()
        total_giros = db.session.query(db.func.sum(Usuario.giros_realizados)).scalar() or 0
        productos_activos = Producto.query.filter_by(activo=True).count()
        
        return jsonify({
            'total_usuarios': total_usuarios,
            'total_giros': total_giros,
            'productos_activos': productos_activos
        })
    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({
            'total_usuarios': 0,
            'total_giros': 0,
            'productos_activos': 0
        })

# API PARA PREMIOS (CORREGIDA)
@app.route('/api/admin/premios')
def get_premios():  
    try:
        premios = PremioObtenido.query.all()
        premios_list = []
        for premio in premios:
            premio_data = {
                'id': premio.id,
                'usuario_id': premio.usuario_id,
                'producto_id': premio.producto_id,
                'fecha_obtencion': premio.fecha_obtencion.isoformat() if premio.fecha_obtencion else None,
                'canjeado': premio.canjeado
            }
            # Agregar información del producto si existe
            if premio.producto:
                premio_data['producto_nombre'] = premio.producto.nombre
                premio_data['producto_tipo'] = premio.producto.tipo
                premio_data['producto_puntos'] = premio.producto.puntos
            premios_list.append(premio_data)
            
        return jsonify(premios_list)
    except Exception as e:
        print(f"Error getting premios: {e}")
        return jsonify([])

@app.route('/api/admin/premios/<int:premio_id>', methods=['DELETE'])
def delete_premio(premio_id):
    try:
        premio = PremioObtenido.query.get_or_404(premio_id)
        db.session.delete(premio)
        db.session.commit()
        return jsonify({'message': 'Premio eliminado correctamente'})
    except Exception as e:
        print(f"Error deleting premio: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/premios', methods=['POST'])
def create_premio():    
    try:
        data = request.json
        premio = PremioObtenido(
            usuario_id=data['usuario_id'],
            producto_id=data['producto_id']
        )
        db.session.add(premio)
        db.session.commit()
        
        # Devolver datos completos del premio creado
        premio_data = {
            'id': premio.id,
            'usuario_id': premio.usuario_id,
            'producto_id': premio.producto_id,
            'fecha_obtencion': premio.fecha_obtencion.isoformat() if premio.fecha_obtencion else None,
            'canjeado': premio.canjeado
        }
        return jsonify(premio_data)
    except Exception as e:
        print(f"Error creating premio: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/premios/<int:premio_id>', methods=['PUT'])
def update_premio(premio_id):
    try:
        data = request.json
        premio = PremioObtenido.query.get_or_404(premio_id)
        
        if 'usuario_id' in data:
            premio.usuario_id = data['usuario_id']
        if 'producto_id' in data:
            premio.producto_id = data['producto_id']
        if 'canjeado' in data:
            premio.canjeado = data['canjeado']
            if data['canjeado']:
                premio.fecha_canje = datetime.now()
        
        db.session.commit()
        
        premio_data = {
            'id': premio.id,
            'usuario_id': premio.usuario_id,
            'producto_id': premio.producto_id,
            'fecha_obtencion': premio.fecha_obtencion.isoformat() if premio.fecha_obtencion else None,
            'canjeado': premio.canjeado
        }
        return jsonify(premio_data)
    except Exception as e:
        print(f"Error updating premio: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# INICIALIZACIÓN DE LA BASE DE DATOS
def init_db():
    with app.app_context():
        db.create_all()
        
        # Productos por defecto si no existen
        if Producto.query.count() == 0:
            productos_default = [
                Producto(nombre="Premio Mayor", tipo="prize", puntos=100, probabilidad=0.05, color="#FFD700"),
                Producto(nombre="Viaje a la Playa", tipo="prize", puntos=80, probabilidad=0.08, color="#4CAF50"),
                Producto(nombre="Tarjeta Regalo $50", tipo="prize", puntos=60, probabilidad=0.1, color="#2196F3"),
                Producto(nombre="Pierdes Turno", tipo="penalty", puntos=-10, probabilidad=0.15, color="#F44336"),
                Producto(nombre="Giro Extra", tipo="bonus", puntos=0, probabilidad=0.07, color="#9C27B0"),
            ]
            
            for producto in productos_default:
                db.session.add(producto)
            db.session.commit()
            print("✅ Base de datos inicializada con productos por defecto")

if __name__ == '__main__':
    init_db()
    print("🚀 Servidor Flask iniciado en http://localhost:5000")
    print("📊 Panel Admin React: http://localhost:3000") 
    print("🎯 Ruleta Principal: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)

    # Ejemplo de uso de la API
    response = requests.post('http://localhost:5000/api/admin/premios', json={
        'usuario_id': 1,
        'producto_id': 1
    })