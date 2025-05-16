// src/api/complete-siwe.ts
import { Request, Response } from 'express';
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js';

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

export async function POST(req: Request, res: Response) {
  const { payload, nonce } = req.body as IRequestPayload;

  const storedNonce = req.cookies.siwe;
  if (nonce !== storedNonce) {
    return res.status(400).json({ status: 'error', isValid: false, message: 'Nonce inválido' });
  }

  try {
    const validMessage = await verifySiweMessage(payload, nonce);
    return res.json({ status: 'success', isValid: validMessage.isValid });
  } catch (error: any) {
    return res.status(400).json({ status: 'error', isValid: false, message: error.message });
  }
}