# backend/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

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
    imagen_url = db.Column(db.String(200))
    color = db.Column(db.String(7), default='#4CAF50')
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'text': self.nombre,
            'type': self.tipo,
            'puntos': self.puntos,
            'stock': self.stock,
            'probabilidad': self.probabilidad,
            'activo': self.activo,
            'imagen_url': self.imagen_url,
            'color': self.color
        }

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.String(50), primary_key=True)
    puntos = db.Column(db.Integer, default=100)
    giros_realizados = db.Column(db.Integer, default=0)
    nivel = db.Column(db.Integer, default=1)
    experiencia = db.Column(db.Integer, default=0)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    ultimo_giro = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'puntos': self.puntos,
            'giros_realizados': self.giros_realizados,
            'nivel': self.nivel,
            'experiencia': self.experiencia
        }

class PremioObtenido(db.Model):
    __tablename__ = 'premios_obtenidos'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.String(50), db.ForeignKey('usuarios.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    fecha_obtencion = db.Column(db.DateTime, default=datetime.utcnow)
    canjeado = db.Column(db.Boolean, default=False)
    