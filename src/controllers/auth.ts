import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'Tripode123';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  // Por ahora, usamos credenciales hardcodeadas para pruebas
  // En producción, esto debería validar contra una base de datos
  if (username === 'admin_test' && password === 'admin123') {
    const token = jwt.sign(
      { 
        id: username,
        isAdmin: true 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
};