// frontend/src/types.ts
export interface Producto {
  id: number;
  nombre: string;
  tipo: 'prize' | 'penalty' | 'bonus' | 'wildcard';
  puntos: number;
  stock: number;
  probabilidad: number;
  activo: boolean;
  color: string;
  imagen_url?: string;
}

export interface Estadisticas {
  total_usuarios: number;
  total_giros: number;
  productos_activos: number;
}