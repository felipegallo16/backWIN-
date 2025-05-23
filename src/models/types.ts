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
  fecha_fin?: Date | null;
  fecha_inicio?: Date;
  minimo_numeros_vendidos?: number; // Mínimo de números que deben venderse para que el sorteo sea válido
  maximo_numeros_por_usuario?: number; // Máximo de números que puede comprar un usuario
  porcentaje_minimo_vendido?: number; // Porcentaje mínimo de números que deben venderse
  reglas_especiales?: string; // Reglas adicionales del sorteo
  imagen_url?: string; // URL de la imagen del sorteo
  estado: 'BORRADOR' | 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
}

export interface Raffle {
  id: string;                    // UUID del sorteo
  nombre: string;                // Nombre del sorteo
  descripcion: string;           // Descripción detallada del sorteo
  tipo: TipoSorteo;             // Tipo de sorteo (TOKEN o MATERIAL)
  premio: Premio;               // Premio del sorteo (Token o Material)
  configuracion: ConfiguracionSorteo; // Configuración del sorteo
  numeros_vendidos: number[];    // Array de números vendidos
  premio_acumulado?: number;     // Premio acumulado (solo para sorteos TOKEN)
  sorteo_anterior?: string;      // ID del sorteo anterior (para sorteos TOKEN)
  creado_por: string;           // ID del administrador que creó el sorteo
  fecha_creacion: Date;         // Fecha de creación del sorteo
  fecha_actualizacion: Date;    // Fecha de última actualización
  ganador?: {                   // Información del ganador (opcional)
    numero: number;             // Número ganador
    nullifier_hash: string;     // Hash del ganador
  };
}

export interface Participacion {
  id?: string;                  // UUID de la participación (opcional, se genera automáticamente)
  raffleId: string;             // ID del sorteo
  nullifier_hash: string;       // Hash del participante
  numero_asignado: number;      // Número asignado al participante
  fecha: Date;                  // Fecha de la participación
  usuario_id: string;           // ID del usuario que participó
  cantidad_numeros: number;     // Cantidad de números comprados
}

export interface ProofData {
  nullifier_hash: string;       // Hash del participante
  merkle_root: string;          // Raíz del árbol Merkle
  proof: string;                // Prueba de World ID
  verification_level: string;   // Nivel de verificación
} 