import express, { Request, Response, NextFunction } from 'express';
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
import { rateLimiter } from '../middleware/rateLimiter';
import { validateParticipacion, validateRaffleId } from '../middleware/validators';
import {
  getInfo,
  getRaffles,
  getRaffleById,
  createNewRaffle,
  participate,
  getWinner,
  updateRaffleConfig,
  getRaffleNotifications,
  getRaffleStatus
} from '../controllers/raffles';

const router = express.Router();

// Información de la API - Cambiamos la ruta a /info
router.get('/info', (req: Request, res: Response) => {
  res.json({
    message: 'WinTrust API',
    version: '1.0.0',
    endpoints: {
      'GET /sorteos': 'Lista todos los sorteos activos',
      'GET /sorteos/:id': 'Obtiene detalles de un sorteo',
      'POST /sorteos/participar': 'Permite participar en un sorteo',
      'GET /sorteos/:id/ganador': 'Obtiene el ganador de un sorteo',
      'POST /sorteos/crear': 'Crea un nuevo sorteo (solo admin)',
      'PATCH /sorteos/:id': 'Actualiza la configuración de un sorteo',
      'GET /sorteos/notificaciones/:userId': 'Obtiene notificaciones de un usuario',
      'GET /sorteos/status/:id': 'Obtiene el estado de un sorteo',
    },
  });
});

// Listar sorteos activos - Ahora es la ruta principal
router.get('/', getRaffles);

// Obtener un sorteo por ID
router.get('/:id', getRaffleById);

// Crear un nuevo sorteo
router.post('/crear', createNewRaffle);

// Actualizar configuración de un sorteo
router.patch('/:id', updateRaffleConfig);

// Participar en un sorteo
router.post('/participar', participate);

// Obtener ganador de un sorteo
router.get('/:id/ganador', getWinner);

// Obtener notificaciones de un usuario
router.get('/notificaciones/:userId', getRaffleNotifications);

// Obtener estado de un sorteo
router.get('/status/:id', getRaffleStatus);

export default router;