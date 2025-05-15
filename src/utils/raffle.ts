import { getRaffle, setRaffleWinner, createRaffle, updateRaffle, getParticipaciones } from '../models/database';
import { Raffle, TipoSorteo } from '../models/types';

export const selectRaffleWinner = (raffleId: string): void => {
  const raffle = getRaffle(raffleId);
  if (!raffle || raffle.ganador) return;

  const numeros_vendidos = raffle.numeros_vendidos;
  
  if (raffle.tipo === 'MATERIAL') {
    // Para sorteos MATERIAL, siempre debe haber un ganador si hay números vendidos
    if (numeros_vendidos.length === 0) {
      // Si no hay números vendidos, cancelamos el sorteo
      updateRaffle(raffleId, {
        configuracion: {
          ...raffle.configuracion,
          estado: 'FINALIZADO'
        }
      });
      return;
    }

    // Seleccionar ganador aleatorio entre los números vendidos
    const numero_ganador = numeros_vendidos[Math.floor(Math.random() * numeros_vendidos.length)];
    const participacion = getParticipaciones(raffleId).find(p => p.numero_asignado === numero_ganador);
    
    if (participacion) {
      setRaffleWinner(raffleId, numero_ganador, participacion.nullifier_hash);
      updateRaffle(raffleId, {
        configuracion: {
          ...raffle.configuracion,
          estado: 'FINALIZADO'
        }
      });
    }
  } else if (raffle.tipo === 'TOKEN') {
    // Para sorteos TOKEN, seleccionamos un número aleatorio entre todos los posibles
    const numero_ganador = Math.floor(Math.random() * raffle.configuracion.total_numeros) + 1;
    
    if (numeros_vendidos.includes(numero_ganador)) {
      // Si el número ganador fue vendido, asignamos el premio
      const participacion = getParticipaciones(raffleId).find(p => p.numero_asignado === numero_ganador);
      if (participacion) {
        setRaffleWinner(raffleId, numero_ganador, participacion.nullifier_hash);
        updateRaffle(raffleId, {
          configuracion: {
            ...raffle.configuracion,
            estado: 'FINALIZADO'
          }
        });
      }
    } else {
      // Si el número ganador no fue vendido, creamos un nuevo sorteo con el premio acumulado
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
          fecha_fin: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas desde ahora
          estado: 'ACTIVO'
        },
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      };

      createRaffle(nuevoSorteo);
      updateRaffle(raffleId, {
        configuracion: {
          ...raffle.configuracion,
          estado: 'FINALIZADO'
        }
      });
    }
  }
}; 