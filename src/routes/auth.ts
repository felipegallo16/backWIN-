// src/routes/auth.ts
import express from 'express';
import { GET as getNonce } from '../api/nonce';
// import { POST as completeSiwe } from '../api/complete-siwe';
import { login } from '../controllers/auth';

const router = express.Router();

router.get('/nonce', getNonce);
// router.post('/complete-siwe', completeSiwe);
router.post('/login', login);

export default router;