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
} from '../models/database';
import { ProofData, TipoSorteo, PremioToken, PremioMaterial, ConfiguracionSorteo } from '../models/types';

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

export const getRaffles = (req: Request, res: Response): void => {
  const activeRaffles = getActiveRaffles();
  res.json(activeRaffles);
};

export const getRaffleById = (req: Request, res: Response): void => {
  const raffle = getRaffle(req.params.id);
  if (!raffle) {
    res.status(404).json({ error: 'Sorteo no encontrado' });
    return;
  }
  res.json(raffle);
};

export const createNewRaffle = (req: Request, res: Response): void => {
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
    fecha_fin: new Date(configuracion.fecha_fin || Date.now() + 24 * 60 * 60 * 1000),
    fecha_inicio: configuracion.fecha_inicio ? new Date(configuracion.fecha_inicio) : new Date(),
    minimo_numeros_vendidos: configuracion.minimo_numeros_vendidos,
    maximo_numeros_por_usuario: configuracion.maximo_numeros_por_usuario,
    porcentaje_minimo_vendido: configuracion.porcentaje_minimo_vendido,
    reglas_especiales: configuracion.reglas_especiales,
    imagen_url: configuracion.imagen_url,
    estado: configuracion.estado || 'BORRADOR'
  };

  const raffle = {
    id: Date.now().toString(),
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

  createRaffle(raffle);
  res.json(raffle);
};

export const updateRaffleConfig = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { configuracion } = req.body;

  const raffle = getRaffle(id);
  if (!raffle) {
    res.status(404).json({ error: 'Sorteo no encontrado' });
    return;
  }

  if (raffle.configuracion.estado !== 'BORRADOR') {
    if (raffle.configuracion.estado === 'ACTIVO') {
      const fechaInicio = raffle.configuracion.fecha_inicio || raffle.fecha_creacion;
      const tiempoTranscurrido = Date.now() - fechaInicio.getTime();
      const ventanaModificacion = 30 * 60 * 1000;

      if (tiempoTranscurrido > ventanaModificacion) {
        res.status(403).json({ 
          error: 'No se pueden realizar modificaciones después de 30 minutos de iniciado el sorteo',
          detalles: {
            tiempoTranscurrido: Math.floor(tiempoTranscurrido / 60000) + ' minutos',
            ventanaModificacion: '30 minutos'
          }
        });
        return;
      }
    } else {
      res.status(403).json({ 
        error: 'Solo se pueden modificar sorteos en estado BORRADOR o dentro de la ventana de 30 minutos después de activarse',
        estadoActual: raffle.configuracion.estado
      });
      return;
    }
  }

  const camposNoModificables = [
    'total_numeros',
    'precio_por_numero',
    'premio'
  ];

  const camposModificados = Object.keys(configuracion);
  const camposNoPermitidos = camposModificados.filter(campo => 
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

  updateRaffle(id, { configuracion: updatedConfig });
  res.json({ 
    mensaje: 'Configuración actualizada exitosamente',
    advertencia: raffle.configuracion.estado === 'ACTIVO' ? 
      'Modificación realizada dentro de la ventana de 30 minutos' : 
      undefined
  });
};

export const participate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { raffleId, numero_elegido, proof, action, signal, cantidad_numeros = 1 } = req.body;

  try {
    // Validar parámetros requeridos
    if (!raffleId || !proof || !action) {
      res.status(400).json({ error: 'Faltan parámetros requeridos: raffleId, proof o action' });
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

    // Verificar fecha
    if (new Date() > raffle.configuracion.fecha_fin) {
      res.status(400).json({ error: 'El sorteo ha finalizado' });
      return;
    }

    // Verificar la prueba de World ID
    const verificationResult = await verifyWorldIDProof(proof as ProofData, action, signal);
    if (!verificationResult.success) {
      res.status(400).json({ error: verificationResult.error });
      return;
    }

    // Verificar máximo de números por usuario
    if (raffle.configuracion.maximo_numeros_por_usuario) {
      const participacionesUsuario = getParticipaciones(raffleId)
        .filter(p => p.usuario_id === proof.nullifier_hash)
        .reduce((acc, p) => acc + p.cantidad_numeros, 0);

      if (participacionesUsuario + cantidad_numeros > raffle.configuracion.maximo_numeros_por_usuario) {
        res.status(400).json({ error: 'Excede el máximo de números permitidos por usuario' });
        return;
      }
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
        (_, i) => i + 1
      ).filter(n => !raffle.numeros_vendidos.includes(n));

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
    addParticipacion({
      raffleId,
      nullifier_hash: proof.nullifier_hash,
      numero_asignado: numeros_asignados[0],
      fecha: new Date(),
      usuario_id: proof.nullifier_hash,
      cantidad_numeros
    });

    res.json({
      mensaje: 'Participación exitosa',
      numeros_asignados,
      nullifier_hash_masked: maskNullifierHash(proof.nullifier_hash),
    });
  } catch (error) {
    console.error('Error in participate:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
    next(error);
  }
};

export const getWinner = (req: Request, res: Response): void => {
  const raffle = getRaffle(req.params.id);
  if (!raffle) {
    res.status(404).json({ error: 'Sorteo no encontrado' });
    return;
  }

  if (!raffle.ganador) {
    if (new Date() > raffle.configuracion.fecha_fin) {
      selectRaffleWinner(req.params.id);
      const updatedRaffle = getRaffle(req.params.id);
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

export const getRaffleNotifications = (req: Request, res: Response): void => {
  const { userId } = req.params;
  const raffles = getAllRaffles();
  
  const userNotifications = raffles.map(raffle => {
    const participaciones = getParticipaciones(raffle.id)
      .filter(p => p.usuario_id === userId);
    
    if (participaciones.length === 0) return null;

    const numerosComprados = participaciones.map(p => p.numero_asignado);
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
  }).filter(Boolean);

  res.json(userNotifications);
};

export const getRaffleStatus = (req: Request, res: Response): void => {
  const { id } = req.params;
  const raffle = getRaffle(id);
  
  if (!raffle) {
    res.status(404).json({ error: 'Sorteo no encontrado' });
    return;
  }

  const status = {
    id: raffle.id,
    nombre: raffle.nombre,
    estado: raffle.configuracion.estado,
    fechaFin: raffle.configuracion.fecha_fin,
    numerosVendidos: raffle.numeros_vendidos.length,
    totalNumeros: raffle.configuracion.total_numeros,
    porcentajeVendido: (raffle.numeros_vendidos.length / raffle.configuracion.total_numeros) * 100,
    premio: raffle.premio,
    premioAcumulado: raffle.premio_acumulado,
    ganador: raffle.ganador ? {
      numero: raffle.ganador.numero,
      nullifier_hash_masked: maskNullifierHash(raffle.ganador.nullifier_hash)
    } : null
  };

  res.json(status);
};