import { Pool, PoolClient } from 'pg';
import { Raffle, Participacion } from './types';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Verificar que las variables de entorno estén cargadas
console.log('Configuración de la base de datos:', {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

export const getActiveRaffles = async (): Promise<Raffle[]> => {
  const result = await pool.query(
    "SELECT * FROM raffles WHERE configuracion->>'estado' = 'ACTIVO'"
  );
  return result.rows;
};

export const getRaffle = async (id: string): Promise<Raffle | null> => {
  const result = await pool.query('SELECT * FROM raffles WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createRaffle = async (raffle: Raffle): Promise<void> => {
  await pool.query(
    'INSERT INTO raffles (id, nombre, descripcion, tipo, premio, configuracion, numeros_vendidos, premio_acumulado, creado_por, fecha_creacion, fecha_actualizacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
    [
      raffle.id,
      raffle.nombre,
      raffle.descripcion,
      raffle.tipo,
      raffle.premio,
      raffle.configuracion,
      raffle.numeros_vendidos,
      raffle.premio_acumulado,
      raffle.creado_por,
      raffle.fecha_creacion,
      raffle.fecha_actualizacion,
    ]
  );
};

export const updateRaffle = async (id: string, updates: Partial<Raffle>, client?: PoolClient): Promise<void> => {
  const query = client || pool;
  await query.query(
    'UPDATE raffles SET numeros_vendidos = $1, fecha_actualizacion = $2 WHERE id = $3',
    [updates.numeros_vendidos, new Date(), id]
  );
};

export const addParticipacion = async (participacion: Participacion, client?: PoolClient): Promise<void> => {
  const query = client || pool;
  await query.query(
    'INSERT INTO participations (id, raffle_id, nullifier_hash, numero_asignado, fecha, usuario_id, cantidad_numeros) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      randomUUID(),
      participacion.raffleId,
      participacion.nullifier_hash,
      participacion.numero_asignado,
      participacion.fecha,
      participacion.usuario_id,
      participacion.cantidad_numeros,
    ]
  );
};

export const getParticipaciones = async (raffleId: string): Promise<Participacion[]> => {
  const result = await pool.query('SELECT * FROM participations WHERE raffle_id = $1', [raffleId]);
  return result.rows;
};

export const getAllRaffles = async (): Promise<Raffle[]> => {
  try {
    const result = await pool.query('SELECT * FROM raffles');
    if (!result.rows || result.rows.length === 0) {
      return [];
    }
    // Asegurarse de que los campos JSON se parseen correctamente
    const raffles = result.rows.map(row => {
      try {
        return {
          ...row,
          premio: typeof row.premio === 'string' ? JSON.parse(row.premio) : row.premio,
          configuracion: typeof row.configuracion === 'string' ? JSON.parse(row.configuracion) : row.configuracion
        };
      } catch (error) {
        return row;
      }
    });
    return raffles;
  } catch (error) {
    console.error('Error en getAllRaffles:', error);
    throw error;
  }
};

export const beginTransaction = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  await client.query('BEGIN');
  return client;
};

export const commitTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('COMMIT');
  client.release();
};

export const rollbackTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('ROLLBACK');
  client.release();
};

export const lockRaffle = async (raffleId: string, client: PoolClient): Promise<Raffle | null> => {
  const result = await client.query('SELECT * FROM raffles WHERE id = $1 FOR UPDATE', [raffleId]);
  return result.rows[0] || null;
};

export const setRaffleWinner = async (raffleId: string, ganador: { numero: number; nullifier_hash: string }): Promise<void> => {
  await pool.query(
    'UPDATE raffles SET ganador = $1 WHERE id = $2',
    [ganador, raffleId]
  );
};