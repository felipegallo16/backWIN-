// src/api/complete-siwe.ts
import { NextRequest, NextResponse } from 'next/server';
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js';

interface IRequestPayload {
  payload: {
    proof: MiniAppWalletAuthSuccessPayload;
  };
  action: string;
  signal: string;
  nonce: string;
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal, nonce } = await req.json() as IRequestPayload;
    const { proof } = payload;

    // Validación temprana del nonce
    const storedNonce = req.cookies.get('siwe')?.value;
    if (!storedNonce) {
      return NextResponse.json(
        { status: 'error', message: 'No se encontró el nonce en las cookies' },
        { status: 401 }
      );
    }

    if (nonce !== storedNonce) {
      return NextResponse.json(
        { status: 'error', message: 'Nonce no corresponde' },
        { status: 401 }
      );
    }

    // Si el nonce es válido, proceder con la verificación SIWE
    const validMessage = await verifySiweMessage(proof, nonce);
    return NextResponse.json(
      { status: 'success', isValid: validMessage.isValid },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 400 }
    );
  }
}