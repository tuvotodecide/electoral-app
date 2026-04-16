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

const getRepositoryType = () => {
  if (FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
    return 'api';
  }
  return 'mock';
};

/**
 * Hook que retorna el repositorio de elecciones configurado
 * @returns {typeof ElectionRepositoryMock}
 */
export const useElectionRepository = () => {
  const repository = useMemo(() => {
    switch (getRepositoryType()) {
      case 'api':
        return ElectionRepositoryApi;
      case 'mock':
      default:
        return ElectionRepositoryMock;
    }
  }, []);

  return repository;
};

/**
 * Obtener repositorio sin hook (para uso en callbacks/handlers)
 * @returns {typeof ElectionRepositoryMock}
 */
export const getElectionRepository = () => {
  switch (getRepositoryType()) {
    case 'api':
      return ElectionRepositoryApi;
    case 'mock':
    default:
      return ElectionRepositoryMock;
  }
};

export default useElectionRepository;
