import express, { Request, Response } from 'express';
import { authAdmin } from '../middleware/authAdmin'; // Middleware de autenticación para administradores
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

// Rutas públicas
router.get('/info', getInfo);
router.get('/', getRaffles);
router.get('/:id', getRaffleById);
router.get('/:id/ganador', getWinner);
router.get('/:id/status', validateRaffleId, getRaffleStatus);
router.get('/notificaciones/:userId', getRaffleNotifications);

// Rutas protegidas para administradores
router.post('/crear', authAdmin, createNewRaffle); // Crear un sorteo, protegido
router.patch('/:id', validateRaffleId, authAdmin, updateRaffleConfig); // Modificar un sorteo, protegido

// Ruta para participar en el sorteo (no requiere ser admin)
router.post('/participar', validateParticipacion, rateLimiter, participate);

export default router;