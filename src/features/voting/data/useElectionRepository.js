/**
 * Election Repository Hook
 *
 * Hook para obtener el repositorio de elecciones.
 * Permite cambiar entre mock y API sin afectar la UI.
 */

import { useMemo } from 'react';
import ElectionRepositoryMock from './repositories/ElectionRepository.mock';
import ElectionRepositoryApi from './repositories/ElectionRepository.api';

// Configuración: cambiar a 'api' cuando exista backend real
const REPOSITORY_TYPE = 'mock'; // 'mock' | 'api'

/**
 * Hook que retorna el repositorio de elecciones configurado
 * @returns {typeof ElectionRepositoryMock}
 */
export const useElectionRepository = () => {
  const repository = useMemo(() => {
    switch (REPOSITORY_TYPE) {
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
  switch (REPOSITORY_TYPE) {
    case 'api':
      return ElectionRepositoryApi;
    case 'mock':
    default:
      return ElectionRepositoryMock;
  }
};

export default useElectionRepository;
