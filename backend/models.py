from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Producto(db.Model):
    __tablename__ = 'productos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    puntos = db.Column(db.Integer, default=0)
    stock = db.Column(db.Integer, default=1)
    probabilidad = db.Column(db.Float, default=1.0)
    activo = db.Column(db.Boolean, default=True)
    color = db.Column(db.String(7), default='#4CAF50')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'tipo': self.tipo,
            'puntos': self.puntos,
            'stock': self.stock,
            'probabilidad': self.probabilidad,
            'activo': self.activo,
            'color': self.color
        }

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.String(50), primary_key=True)
    puntos = db.Column(db.Integer, default=100)
    giros_realizados = db.Column(db.Integer, default=0)
    ultimo_giro = db.Column(db.DateTime)

class PremioObtenido(db.Model):
    __tablename__ = 'premios_obtenidos'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.String(50), nullable=False)
    producto_id = db.Column(db.Integer, nullable=False)
    fecha_obtencion = db.Column(db.DateTime, default=datetime.utcnow)
    canjeado = db.Column(db.Boolean, default=False)