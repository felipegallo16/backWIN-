// import { verifyCloudProof, VerificationLevel } from '@worldcoin/idkit';
import { ProofData } from '../models/types';
import { checkNullifierHashReuse } from './security';

export const verifyWorldIDProof = async (
  proofData: ProofData,
  action: string
): Promise<{ success: boolean; error?: string }> => {
  // Simulación: solo verifica si el nullifier_hash ya fue usado
  if (checkNullifierHashReuse(action, proofData.nullifier_hash)) {
    return {
      success: false,
      error: 'Este proof ya fue utilizado para esta acción'
    };
  }
  // Siempre retorna éxito para pruebas locales
  return { success: true };
}; 