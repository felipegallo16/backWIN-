import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aquí';

export const loginAdmin = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'Tripode123') {
    const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Credenciales inválidas' });
};