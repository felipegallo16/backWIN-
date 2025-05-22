import { createClient } from '@supabase/supabase-js';
import { Raffle, Participacion } from './types';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env en la raíz del proyecto
const envPath = path.resolve(__dirname, '../../.env');
console.log('Intentando cargar .env desde:', envPath);
dotenv.config({ path: envPath });

// Verificar que el archivo .env se cargó correctamente
console.log('Ruta del archivo .env:', envPath);
console.log('URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('ERROR: Variables de entorno de Supabase no están definidas en el archivo .env');
  process.exit(1);
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const getActiveRaffles = async (): Promise<Raffle[]> => {
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('configuracion->estado', 'ACTIVO');
  
  if (error) throw error;
  return data || [];
};

export const getRaffle = async (id: string): Promise<Raffle | null> => {
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createRaffle = async (raffle: Raffle): Promise<void> => {
  const { error } = await supabase
    .from('raffles')
    .insert([raffle]);
  
  if (error) throw error;
};

export const updateRaffle = async (id: string, updates: Partial<Raffle>): Promise<void> => {
  const { error } = await supabase
    .from('raffles')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
};

export const addParticipacion = async (participacion: Participacion): Promise<void> => {
  const { error } = await supabase
    .from('participations')
    .insert([{
      id: randomUUID(),
      ...participacion
    }]);
  
  if (error) throw error;
};

export const getParticipaciones = async (raffleId: string): Promise<Participacion[]> => {
  const { data, error } = await supabase
    .from('participations')
    .select('*')
    .eq('raffle_id', raffleId);
  
  if (error) throw error;
  return data || [];
};

export const getAllRaffles = async (): Promise<Raffle[]> => {
  try {
    const { data, error } = await supabase
      .from('raffles')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error en getAllRaffles:', error);
    throw error;
  }
};

export const setRaffleWinner = async (raffleId: string, ganador: { numero: number; nullifier_hash: string }): Promise<void> => {
  const { error } = await supabase
    .from('raffles')
    .update({ ganador })
    .eq('id', raffleId);
  
  if (error) throw error;
};