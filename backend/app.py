from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Producto, Usuario, PremioObtenido
from datetime import datetime
import random
import os

# Crear aplicación Flask
app = Flask(__name__)

# Configuración para producción
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ruleta.db')
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)
    
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'clave-secreta-ruleta-2024')

# Configurar CORS - IMPORTANTE para producción
CORS(app)

# Inicializar base de datos con la app
db.init_app(app)

# RUTAS DE LA API
@app.route('/')
def home():
    return jsonify({
        "message": "🚀 Backend de Ruleta funcionando!",
        "status": "success", 
        "endpoints": {
            "test": "/api/test",
            "ruleta_items": "/api/ruleta/items", 
            "girar_ruleta": "/api/ruleta/girar (POST)",
            "admin_productos": "/api/admin/productos",
            "estadisticas": "/api/admin/estadisticas"
        }
    })

@app.route('/api/test')
def test_api():
    return jsonify({"status": "success", "message": "✅ API funcionando correctamente!"})

@app.route('/api/ruleta/items')
def get_ruleta_items():
    try:
        productos = Producto.query.filter_by(activo=True).all()
        items = [p.to_dict() for p in productos]
        return jsonify({'items': items})
    except Exception as e:
        print(f"Error en /api/ruleta/items: {e}")
        return jsonify({'items': []})

@app.route('/api/ruleta/girar', methods=['POST'])
def girar_ruleta():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        
        # Buscar o crear usuario
        usuario = Usuario.query.get(user_id)
        if not usuario:
            usuario = Usuario(id=user_id, puntos=100)
            db.session.add(usuario)
        
        # Obtener productos activos
        productos = Producto.query.filter_by(activo=True).all()
        if not productos:
            return jsonify({'error': 'No hay productos disponibles'}), 400
        
        # Calcular probabilidades
        total_prob = sum(p.probabilidad for p in productos)
        productos_con_prob = []
        for p in productos:
            productos_con_prob.append({
                'producto': p,
                'probabilidad': p.probabilidad / total_prob
            })
        
        # Seleccionar ganador
        rand = random.random()
        acumulado = 0
        producto_ganador = None
        
        for item in productos_con_prob:
            acumulado += item['probabilidad']
            if rand <= acumulado:
                producto_ganador = item['producto']
                break
        
        if not producto_ganador:
            producto_ganador = productos[0]
        
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
        db.session.rollback()
        print(f"Error en girar_ruleta: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/admin/productos', methods=['GET'])
def get_productos():
    try:
        productos = Producto.query.all()
        return jsonify([p.to_dict() for p in productos])
    except Exception as e:
        print(f"Error en get_productos: {e}")
        return jsonify([])

@app.route('/api/admin/productos', methods=['POST'])
def create_producto():
    try:
        data = request.get_json()
        producto = Producto(
            nombre=data.get('nombre', 'Nuevo Producto'),
            tipo=data.get('tipo', 'prize'),
            puntos=data.get('puntos', 0),
            stock=data.get('stock', 1),
            probabilidad=data.get('probabilidad', 1.0),
            color=data.get('color', '#4CAF50')
        )
        db.session.add(producto)
        db.session.commit()
        return jsonify(producto.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/productos/<int:producto_id>', methods=['DELETE'])
def delete_producto(producto_id):
    try:
        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        db.session.delete(producto)
        db.session.commit()
        return jsonify({'message': 'Producto eliminado'})
    except Exception as e:
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
        print(f"Error en estadisticas: {e}")
        return jsonify({
            'total_usuarios': 0,
            'total_giros': 0,
            'productos_activos': 0
        })

# INICIALIZAR BASE DE DATOS
def init_db():
    with app.app_context():
        try:
            db.create_all()
            
            # Agregar productos de ejemplo si no existen
            if Producto.query.count() == 0:
                productos_ejemplo = [
                    Producto(nombre="🎁 Premio Mayor", tipo="prize", puntos=100, probabilidad=0.05, color="#FFD700", stock=10),
                    Producto(nombre="🏖️ Viaje a la Playa", tipo="prize", puntos=80, probabilidad=0.08, color="#4CAF50", stock=5),
                    Producto(nombre="💳 Tarjeta Regalo $50", tipo="prize", puntos=60, probabilidad=0.1, color="#2196F3", stock=8),
                    Producto(nombre="⏸️ Pierdes Turno", tipo="penalty", puntos=-10, probabilidad=0.15, color="#F44336", stock=999),
                    Producto(nombre="🔄 Giro Extra", tipo="bonus", puntos=0, probabilidad=0.07, color="#9C27B0", stock=3),
                    Producto(nombre="✨ Bonus Sorpresa", tipo="bonus", puntos=20, probabilidad=0.1, color="#00BCD4", stock=6),
                    Producto(nombre="🎯 Tiro Perfecto", tipo="prize", puntos=50, probabilidad=0.12, color="#E91E63", stock=4),
                    Producto(nombre="🎴 Comodín", tipo="wildcard", puntos=30, probabilidad=0.08, color="#FF9800", stock=2),
                ]
                
                for producto in productos_ejemplo:
                    db.session.add(producto)
                
                db.session.commit()
                print("✅ Base de datos inicializada con productos de ejemplo")
            else:
                print("✅ Base de datos ya existe")
                
        except Exception as e:
            print(f"❌ Error inicializando base de datos: {e}")

# Manejo de errores
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Error interno del servidor'}), 500

if __name__ == '__main__':
    print("🚀 Iniciando servidor Flask...")
    init_db()
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"📍 Servidor ejecutándose en puerto: {port}")
    print("📡 Endpoints disponibles:")
    print("   - GET  /")
    print("   - GET  /api/test")
    print("   - GET  /api/ruleta/items")
    print("   - POST /api/ruleta/girar")
    print("   - GET  /api/admin/productos")
    print("   - POST /api/admin/productos")
    print("   - GET  /api/admin/estadisticas")
    print("=" * 50)
    
    app.run(debug=debug, host='0.0.0.0', port=port)