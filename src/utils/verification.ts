import { ProofData } from '../models/types';
import { checkNullifierHashReuse } from './security';

interface VerifyBody {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
  action: string;
  signal?: string;
}

export const verifyWorldIDProof = async (
  proofData: ProofData,
  action: string,
  signal?: string
): Promise<{ success: boolean; error?: string }> => {
  if (checkNullifierHashReuse(action, proofData.nullifier_hash)) {
    return {
      success: false,
      error: 'Este proof ya fue utilizado para esta acción'
    };
  }

  try {
    const body: VerifyBody = {
      proof: proofData.proof,
      merkle_root: proofData.merkle_root,
      nullifier_hash: proofData.nullifier_hash,
      verification_level: proofData.verification_level,
      action,
    };
    if (signal) {
      body.signal = signal;
    }

    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/verify/${process.env.APP_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Worldcoin API error:', result);
      return {
        success: false,
        error: result.detail || result.code || 'Error en la verificación de Worldcoin'
      };
    }

    if (!result.success) {
      console.error('Worldcoin verification failed:', result.detail);
      return {
        success: false,
        error: result.detail || 'Verificación fallida'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error connecting to Worldcoin API:', error);
    return {
      success: false,
      error: 'Error de conexión con el servidor de Worldcoin'
    };
  }
};