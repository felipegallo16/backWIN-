import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { verifyWorldIDProof } from '../utils/verification';
import { selectRaffleWinner } from '../utils/raffle';
import { maskNullifierHash } from '../utils/security';
import {
  getActiveRaffles,
  getRaffle,
  addParticipacion,
  getParticipaciones,
  createRaffle,
  updateRaffle,
  getAllRaffles,
  supabase
} from '../models/database';
import { 
  ProofData, 
  TipoSorteo, 
  PremioToken, 
  PremioMaterial, 
  ConfiguracionSorteo, 
  Participacion, 
  Raffle 
} from '../models/types';

export const getInfo = (req: Request, res: Response): void => {
  res.json({
    message: 'WinTrust API',
    version: '1.0.0',
    endpoints: {
      'GET /sorteos': 'Lista todos los sorteos activos',
      'GET /sorteos/:id': 'Obtiene detalles de un sorteo',
      'POST /sorteos/participar': 'Permite participar en un sorteo',
      'GET /sorteos/:id/ganador': 'Obtiene el ganador de un sorteo',
      'POST /sorteos/crear': 'Crea un nuevo sorteo (solo admin)'
    }
  });
};

export const getRaffles = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Iniciando getRaffles...');
    const raffles = await getAllRaffles();
    console.log('Raffles obtenidos:', raffles);
    res.json(raffles);
  } catch (error: any) {
    console.error('Error detallado al obtener sorteos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los sorteos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getRaffleById = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Buscando sorteo con ID:', req.params.id);
    const raffle = await getRaffle(req.params.id);
    console.log('Resultado de búsqueda:', raffle);
    
    if (!raffle) {
      console.log('Sorteo no encontrado');
      res.status(404).json({ error: 'Sorteo no encontrado' });
      return;
    }
    
    console.log('Enviando respuesta con sorteo:', raffle);
    res.json(raffle);
  } catch (error: any) {
    console.error('Error al obtener detalles del sorteo:', error);
    res.status(500).json({ 
      error: 'Error al obtener los detalles del sorteo',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const createNewRaffle = async (req: Request, res: Response): Promise<void> => {
  const { tipo, premio, configuracion } = req.body;

  if (!tipo || !['TOKEN', 'MATERIAL'].includes(tipo)) {
    res.status(400).json({ error: 'Tipo de sorteo inválido' });
    return;
  }

  let premioObj;
  if (tipo === 'TOKEN') {
    const { cantidad, token } = req.body.premio;
    if (!cantidad || !token) {
      res.status(400).json({ error: 'Faltan datos del premio en tokens' });
      return;
    }
    premioObj = {
      tipo: 'TOKEN' as const,
      cantidad: Number(cantidad),
      token
    };
  } else {
    const { descripcion, valor, moneda } = req.body.premio;
    if (!descripcion || !valor || !moneda) {
      res.status(400).json({ error: 'Faltan datos del premio material' });
      return;
    }
    premioObj = {
      tipo: 'MATERIAL' as const,
      descripcion,
      valor: Number(valor),
      moneda
    };
  }

  const configuracionObj: ConfiguracionSorteo = {
    precio_por_numero: configuracion.precio_por_numero || 1,
    total_numeros: configuracion.total_numeros || 100,
    fecha_fin: configuracion.fecha_fin ? new Date(configuracion.fecha_fin) : null,
    fecha_inicio: configuracion.fecha_inicio ? new Date(configuracion.fecha_inicio) : new Date(),
    minimo_numeros_vendidos: configuracion.minimo_numeros_vendidos,
    maximo_numeros_por_usuario: configuracion.maximo_numeros_por_usuario,
    porcentaje_minimo_vendido: configuracion.porcentaje_minimo_vendido,
    reglas_especiales: configuracion.reglas_especiales,
    imagen_url: configuracion.imagen_url,
    estado: configuracion.estado || 'BORRADOR'
  };

  const raffle = {
    id: randomUUID(),
    nombre: req.body.nombre || "Sorteo de prueba",
    premio: premioObj,
    descripcion: req.body.descripcion || "Un sorteo de prueba",
    configuracion: configuracionObj,
    numeros_vendidos: [],
    tipo: tipo as TipoSorteo,
    premio_acumulado: tipo === 'TOKEN' ? 0 : undefined,
    creado_por: req.body.admin_id,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  };

  await createRaffle(raffle);
  res.json(raffle);
};

export const updateRaffleConfig = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { configuracion } = req.body;

  try {
    const raffle = await getRaffle(id);
    if (!raffle) {
      res.status(404).json({ error: 'Sorteo no encontrado' });
      return;
    }

    // Validar cambios de estado
    if (configuracion.estado) {
      const estadoActual = raffle.configuracion.estado;
      const nuevoEstado = configuracion.estado;

      // Validar transiciones de estado permitidas
      const transicionesPermitidas: { [key: string]: string[] } = {
        'BORRADOR': ['ACTIVO', 'CANCELADO'],
        'ACTIVO': ['FINALIZADO', 'CANCELADO', 'PAUSADO'],
        'PAUSADO': ['ACTIVO', 'CANCELADO'],
        'FINALIZADO': [], // No se puede cambiar desde FINALIZADO
        'CANCELADO': [] // No se puede cambiar desde CANCELADO
      };

      if (!transicionesPermitidas[estadoActual].includes(nuevoEstado)) {
        res.status(403).json({
          error: `No se puede cambiar el estado de ${estadoActual} a ${nuevoEstado}`,
          estadosPermitidos: transicionesPermitidas[estadoActual]
        });
        return;
      }

      // Validaciones específicas para cada cambio de estado
      if (nuevoEstado === 'FINALIZADO') {
        // Verificar si se cumplen las condiciones para finalizar
        const haTerminadoPorFecha = raffle.configuracion.fecha_fin && new Date() > new Date(raffle.configuracion.fecha_fin);
        const haTerminadoPorNumeros = raffle.numeros_vendidos.length >= raffle.configuracion.total_numeros;

        if (!haTerminadoPorFecha && !haTerminadoPorNumeros) {
          res.status(403).json({
            error: 'No se puede finalizar el sorteo',
            razon: 'El sorteo no ha alcanzado su fecha de finalización ni se han vendido todos los números'
          });
          return;
        }

        // Si se finaliza, seleccionar ganador automáticamente
        await selectRaffleWinner(id);
      }
    }

    const camposNoModificables = [
      'total_numeros',
      'precio_por_numero',
      'premio'
    ];

    const camposModificados = Object.keys(configuracion);
    const camposNoPermitidos = camposModificados.filter((campo: string) => 
      camposNoModificables.includes(campo)
    );

    if (camposNoPermitidos.length > 0) {
      res.status(403).json({
        error: 'No se pueden modificar ciertos campos después de activar el sorteo',
        camposNoPermitidos
      });
      return;
    }

    const updatedConfig: ConfiguracionSorteo = {
      ...raffle.configuracion,
      ...configuracion,
      fecha_actualizacion: new Date()
    };

    await updateRaffle(id, { configuracion: updatedConfig });
    res.json({ 
      mensaje: 'Configuración actualizada exitosamente',
      configuracion: updatedConfig
    });
  } catch (error: any) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ 
      error: 'Error al actualizar la configuración',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const participate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { raffleId, numero_elegido, cantidad_numeros = 1 } = req.body;

  try {
    // Validar parámetros requeridos
    if (!raffleId) {
      res.status(400).json({ error: 'Faltan parámetros requeridos: raffleId' });
      return;
    }

    // Verificar que el sorteo exista
    const raffle = await getRaffle(raffleId);
    if (!raffle) {
      res.status(404).json({ error: 'Sorteo no encontrado' });
      return;
    }

    // Verificar estado del sorteo
    if (raffle.configuracion.estado !== 'ACTIVO') {
      res.status(400).json({ error: 'El sorteo no está activo' });
      return;
    }

    // Verificar si el sorteo ha terminado por fecha
    if (raffle.configuracion.fecha_fin && new Date() > raffle.configuracion.fecha_fin) {
      res.status(400).json({ 
        error: 'El sorteo ha finalizado por fecha límite',
        razon: 'fecha'
      });
      return;
    }

    // Verificar si el sorteo ya tiene todos los números vendidos
    if (raffle.numeros_vendidos.length >= raffle.configuracion.total_numeros) {
      res.status(400).json({ 
        error: 'El sorteo ha finalizado porque todos los números han sido vendidos',
        razon: 'numeros_vendidos'
      });
      return;
    }

    // Verificar números disponibles
    if (raffle.numeros_vendidos.length + cantidad_numeros > raffle.configuracion.total_numeros) {
      res.status(400).json({ error: 'No hay suficientes números disponibles' });
      return;
    }

    // Asignar números
    const numeros_asignados: number[] = [];
    if (!numero_elegido) {
      const numeros_disponibles = Array.from(
        { length: raffle.configuracion.total_numeros },
        (_, i: number) => i + 1
      ).filter((n: number) => !raffle.numeros_vendidos.includes(n));

      for (let i = 0; i < cantidad_numeros; i++) {
        const randomIndex = Math.floor(Math.random() * numeros_disponibles.length);
        numeros_asignados.push(numeros_disponibles[randomIndex]);
        numeros_disponibles.splice(randomIndex, 1);
      }
    } else {
      if (cantidad_numeros > 1) {
        res.status(400).json({ error: 'No se puede elegir número específico al comprar múltiples números' });
        return;
      }
      if (numero_elegido < 1 || numero_elegido > raffle.configuracion.total_numeros) {
        res.status(400).json({ error: 'Número fuera de rango' });
        return;
      }
      if (raffle.numeros_vendidos.includes(numero_elegido)) {
        res.status(400).json({ error: 'Número ya vendido' });
        return;
      }
      numeros_asignados.push(numero_elegido);
    }

    // Registrar participación
    await addParticipacion({
      raffleId,
      nullifier_hash: 'test_user',
      numero_asignado: numeros_asignados[0],
      fecha: new Date(),
      usuario_id: 'test_user',
      cantidad_numeros
    });

    // Verificar si esta participación completa todos los números
    const updatedRaffle = await getRaffle(raffleId);
    if (updatedRaffle && updatedRaffle.numeros_vendidos.length >= updatedRaffle.configuracion.total_numeros) {
      // Si se vendieron todos los números, finalizar el sorteo y seleccionar ganador
      await selectRaffleWinner(raffleId);
    }

    res.json({
      mensaje: 'Participación exitosa',
      numeros_asignados,
      nullifier_hash_masked: maskNullifierHash('test_user'),
    });
  } catch (error) {
    console.error('Error in participate:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
    next(error);
  }
};

export const getWinner = async (req: Request, res: Response): Promise<void> => {
  const raffle = await getRaffle(req.params.id);
  if (!raffle) {
    res.status(404).json({ error: 'Sorteo no encontrado' });
    return;
  }

  if (!raffle.ganador) {
    const haTerminadoPorFecha = raffle.configuracion.fecha_fin && new Date() > raffle.configuracion.fecha_fin;
    const haTerminadoPorNumeros = raffle.numeros_vendidos.length >= raffle.configuracion.total_numeros;

    if (haTerminadoPorFecha || haTerminadoPorNumeros) {
      await selectRaffleWinner(req.params.id);
      const updatedRaffle = await getRaffle(req.params.id);
      if (updatedRaffle?.ganador) {
        res.json({
          numero: updatedRaffle.ganador.numero,
          nullifier_hash_masked: maskNullifierHash(updatedRaffle.ganador.nullifier_hash)
        });
        return;
      }
    }
    res.status(404).json({ error: 'El sorteo aún no tiene ganador' });
    return;
  }

  res.json({
    numero: raffle.ganador.numero,
    nullifier_hash_masked: maskNullifierHash(raffle.ganador.nullifier_hash)
  });
};

export const getRaffleNotifications = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const raffles = await getAllRaffles();
  
  const userNotifications = await Promise.all(raffles.map(async (raffle: Raffle) => {
    const participaciones = await getParticipaciones(raffle.id);
    const userParticipaciones = participaciones.filter((p: Participacion) => p.usuario_id === userId);
    
    if (userParticipaciones.length === 0) return null;

    const numerosComprados = userParticipaciones.map((p: Participacion) => p.numero_asignado);
    const esGanador = raffle.ganador && numerosComprados.includes(raffle.ganador.numero);
    
    return {
      raffleId: raffle.id,
      nombre: raffle.nombre,
      estado: raffle.configuracion.estado,
      numerosComprados,
      esGanador,
      fechaFin: raffle.configuracion.fecha_fin,
      premio: raffle.premio,
      premioAcumulado: raffle.premio_acumulado
    };
  }));

  res.json(userNotifications.filter(Boolean));
};

export const getRaffleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const raffle = await getRaffle(id);
    
    if (!raffle) {
      res.status(404).json({ error: 'Sorteo no encontrado' });
      return;
    }

    const participaciones = await getParticipaciones(id);
    const totalParticipaciones = participaciones.length;
    const numerosVendidos = raffle.numeros_vendidos.length;
    const porcentajeVendido = (numerosVendidos / raffle.configuracion.total_numeros) * 100;

    res.json({
      id: raffle.id,
      nombre: raffle.nombre,
      estado: raffle.configuracion.estado,
      fecha_inicio: raffle.configuracion.fecha_inicio,
      fecha_fin: raffle.configuracion.fecha_fin,
      total_numeros: raffle.configuracion.total_numeros,
      numeros_vendidos: numerosVendidos,
      porcentaje_vendido: porcentajeVendido,
      total_participaciones: totalParticipaciones,
      premio_acumulado: raffle.premio_acumulado || 0
    });
  } catch (error) {
    console.error('Error al obtener estado del sorteo:', error);
    res.status(500).json({ error: 'Error al obtener el estado del sorteo' });
  }
};

export const deleteRaffle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const raffle = await getRaffle(id);
  if (!raffle) {
    res.status(404).json({ error: 'Sorteo no encontrado' });
    return;
  }

  // Temporalmente permitimos eliminar sorteos en cualquier estado
  /* Comentamos la validación de estado
  if (raffle.configuracion.estado !== 'BORRADOR') {
    res.status(403).json({ 
      error: 'Solo se pueden eliminar sorteos en estado BORRADOR',
      estadoActual: raffle.configuracion.estado
    });
    return;
  }
  */

  const { error } = await supabase
    .from('raffles')
    .delete()
    .eq('id', id);

  if (error) {
    res.status(500).json({ error: 'Error al eliminar el sorteo' });
    return;
  }

  res.json({ mensaje: 'Sorteo eliminado exitosamente' });
};

export const deleteAllRaffles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('sorteos')
      .delete()
      .neq('id', 'dummy'); // Esto eliminará todos los registros

    if (error) {
      console.error('Error al eliminar los sorteos:', error);
      res.status(500).json({ error: 'Error al eliminar los sorteos', details: error.message });
      return;
    }

    res.json({ message: 'Todos los sorteos han sido eliminados exitosamente' });
  } catch (error) {
    console.error('Error al eliminar los sorteos:', error);
    res.status(500).json({ error: 'Error al eliminar los sorteos', details: error instanceof Error ? error.message : 'Error desconocido' });
  }
};