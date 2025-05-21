import { getRaffle, setRaffleWinner, createRaffle, updateRaffle, getParticipaciones } from '../models/database';
import { Raffle, TipoSorteo, Participacion } from '../models/types';

export const selectRaffleWinner = async (raffleId: string): Promise<void> => {
  const raffle = await getRaffle(raffleId);
  if (!raffle || raffle.ganador) return;

  const numeros_vendidos = raffle.numeros_vendidos;
  
  if (raffle.tipo === 'MATERIAL') {
    if (numeros_vendidos.length === 0) {
      await updateRaffle(raffleId, {
        configuracion: {
          ...raffle.configuracion,
          estado: 'FINALIZADO'
        }
      });
      return;
    }

    const numero_ganador = numeros_vendidos[Math.floor(Math.random() * numeros_vendidos.length)];
    const participaciones = await getParticipaciones(raffleId);
    const participacion = participaciones.find((p: Participacion) => p.numero_asignado === numero_ganador);
    
    if (participacion) {
      await setRaffleWinner(raffleId, {
        numero: numero_ganador,
        nullifier_hash: participacion.nullifier_hash
      });
      await updateRaffle(raffleId, {
        configuracion: {
          ...raffle.configuracion,
          estado: 'FINALIZADO'
        }
      });
    }
  } else {
    // Para sorteos TOKEN
    const numero_ganador = Math.floor(Math.random() * raffle.configuracion.total_numeros) + 1;
    
    if (numeros_vendidos.includes(numero_ganador)) {
      const participaciones = await getParticipaciones(raffleId);
      const participacion = participaciones.find((p: Participacion) => p.numero_asignado === numero_ganador);
      if (participacion) {
        await setRaffleWinner(raffleId, {
          numero: numero_ganador,
          nullifier_hash: participacion.nullifier_hash
        });
        await updateRaffle(raffleId, {
          configuracion: {
            ...raffle.configuracion,
            estado: 'FINALIZADO'
          }
        });
      }
    } else {
      const premioActual = (raffle.premio.tipo === 'TOKEN' ? raffle.premio.cantidad : 0);
      const premioAcumulado = (raffle.premio_acumulado || 0) + premioActual;
      
      const nuevoSorteo: Raffle = {
        ...raffle,
        id: Date.now().toString(),
        nombre: `${raffle.nombre} (Premio Acumulado)`,
        premio: raffle.premio.tipo === 'TOKEN'
          ? { ...raffle.premio, cantidad: premioAcumulado }
          : { ...raffle.premio },
        premio_acumulado: 0,
        sorteo_anterior: raffleId,
        numeros_vendidos: [],
        configuracion: {
          ...raffle.configuracion,
          fecha_fin: new Date(Date.now() + 24 * 60 * 60 * 1000),
          estado: 'ACTIVO'
        },
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      };

      await createRaffle(nuevoSorteo);
      await updateRaffle(raffleId, {
        configuracion: {
          ...raffle.configuracion,
          estado: 'FINALIZADO'
        }
      });
    }
  }
}; 