/**
 * Election Repository Hook
 *
 * Hook para obtener el repositorio de elecciones.
 * Permite cambiar entre mock y API sin afectar la UI.
 */

import { useMemo } from 'react';
import ElectionRepositoryMock from './repositories/ElectionRepository.mock';
import ElectionRepositoryApi from './repositories/ElectionRepository.api';
import {FEATURE_FLAGS} from '../../../config/featureFlags';
import {isDemoActive, useIsDemoActive} from '../../demo/demoSession';

/**
 * @param {boolean} demoActive estado del modo demostración
 * @returns {typeof ElectionRepositoryMock}
 */
const resolveRepository = demoActive => {
  // El modo demostración gana sobre el flag. No basta con apagar
  // ENABLE_VOTING_FLOW: eso hace que enqueueVote y
  // enqueueBackendParticipationSync lancen 'Voting flow is disabled'
  // (queueAdapter.js:261, :294).
  if (demoActive) {
    return ElectionRepositoryMock;
  }
  return FEATURE_FLAGS.ENABLE_VOTING_FLOW
    ? ElectionRepositoryApi
    : ElectionRepositoryMock;
};

/**
 * Hook que retorna el repositorio de elecciones configurado.
 * Se re-evalúa al entrar o salir del modo demostración.
 * @returns {typeof ElectionRepositoryMock}
 */
export const useElectionRepository = () => {
  const demoActive = useIsDemoActive();
  return useMemo(() => resolveRepository(demoActive), [demoActive]);
};

/**
 * Obtener repositorio sin hook (para uso en callbacks/handlers)
 * @returns {typeof ElectionRepositoryMock}
 */
export const getElectionRepository = () => resolveRepository(isDemoActive());
