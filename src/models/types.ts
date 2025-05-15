export type TipoSorteo = 'TOKEN' | 'MATERIAL';

export interface PremioToken {
  tipo: 'TOKEN';
  cantidad: number;
  token: string; // Por ejemplo: 'WLD', 'ETH', etc.
}

export interface PremioMaterial {
  tipo: 'MATERIAL';
  descripcion: string;
  valor: number;
  moneda: string;
}

export type Premio = PremioToken | PremioMaterial;

export interface ConfiguracionSorteo {
  precio_por_numero: number;
  total_numeros: number;
  fecha_fin: Date;
  fecha_inicio?: Date;
  minimo_numeros_vendidos?: number; // Mínimo de números que deben venderse para que el sorteo sea válido
  maximo_numeros_por_usuario?: number; // Máximo de números que puede comprar un usuario
  porcentaje_minimo_vendido?: number; // Porcentaje mínimo de números que deben venderse
  reglas_especiales?: string; // Reglas adicionales del sorteo
  imagen_url?: string; // URL de la imagen del sorteo
  estado: 'BORRADOR' | 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
}

export interface Raffle {
  id: string;
  nombre: string;
  premio: Premio;
  descripcion: string;
  configuracion: ConfiguracionSorteo;
  numeros_vendidos: number[];
  tipo: TipoSorteo;
  premio_acumulado?: number; // Solo para sorteos de tipo TOKEN
  sorteo_anterior?: string; // ID del sorteo anterior (para sorteos de tipo TOKEN)
  creado_por: string; // ID del administrador que creó el sorteo
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  ganador?: {
    numero: number;
    nullifier_hash: string;
  };
}

export interface Participacion {
  raffleId: string;
  nullifier_hash: string;
  numero_asignado: number;
  fecha: Date;
  usuario_id: string; // ID del usuario que participó
  cantidad_numeros: number; // Cantidad de números comprados en esta participación
}

export interface ProofData {
  nullifier_hash: string;
  merkle_root: string;
  proof: string;
  verification_level: string;
} 