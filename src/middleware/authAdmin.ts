import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'Tripode123';

export const authAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Temporalmente permitimos todas las peticiones
  next();
  
  /* Comentamos la verificación de JWT temporalmente
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean };
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'No autorizado: Solo administradores' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  */
};