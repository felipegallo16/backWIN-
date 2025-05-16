// src/api/nonce.ts
import { Request, Response } from 'express';

export async function GET(req: Request, res: Response) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  res.cookie('siwe', nonce, { secure: true, httpOnly: true });
  res.json({ nonce });
}