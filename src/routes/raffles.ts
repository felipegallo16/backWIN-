import express, { Request, Response } from 'express';
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

router.get('/info', getInfo);
router.get('/', getRaffles);
router.get('/:id', getRaffleById);
router.post('/crear', createNewRaffle);
router.post('/participar', validateParticipacion, rateLimiter, participate);
router.get('/:id/ganador', getWinner);
router.patch('/:id', validateRaffleId, updateRaffleConfig);
router.get('/notificaciones/:userId', getRaffleNotifications);
router.get('/status/:id', validateRaffleId, getRaffleStatus);

export default router;