/**
 * API Implementation of Election Repository
 *
 * PLACEHOLDER - Implementar cuando exista backend real.
 *
 * TODO: Cuando el backend esté listo:
 * 1. Importar el cliente HTTP (axios o fetch wrapper)
 * 2. Configurar endpoints reales
 * 3. Implementar cada método con llamadas HTTP
 * 4. Manejar errores y reintentos
 */

// import { API } from '../../../../api/http';
// import { BACKEND } from '@env';

/**
 * API Election Repository
 * NOTA: Este archivo es un placeholder. Los métodos lanzan error hasta que se implemente.
 */
const ElectionRepositoryApi = {
  /**
   * Obtiene información de la elección actual
   * @returns {Promise<import('./ElectionRepository').Election>}
   */
  async getElection() {
    // TODO: Implementar cuando exista endpoint
    // const response = await API.get('/api/v1/elections/current');
    // return response.data;
    throw new Error('[ElectionRepository.api] Not implemented - getElection');
  },

  /**
   * Obtiene lista de candidatos para una elección
   * @param {string} electionId
   * @returns {Promise<import('./ElectionRepository').Candidate[]>}
   */
  async getCandidates(electionId) {
    // TODO: Implementar cuando exista endpoint
    // const response = await API.get(`/api/v1/elections/${electionId}/candidates`);
    // return response.data;
    throw new Error('[ElectionRepository.api] Not implemented - getCandidates');
  },

  /**
   * Envía voto
   * @param {string} electionId
   * @param {string} candidateId
   * @returns {Promise<import('./ElectionRepository').VoteResult>}
   */
  async submitVote(electionId, candidateId) {
    // TODO: Implementar cuando exista endpoint
    // const response = await API.post(`/api/v1/elections/${electionId}/vote`, {
    //   candidateId,
    // });
    // return response.data;
    throw new Error('[ElectionRepository.api] Not implemented - submitVote');
  },

  /**
   * Genera NFT de participación
   * @param {string} electionId
   * @param {string} candidateId
   * @returns {Promise<{nftId: string, imageUrl: string}>}
   */
  async mintNFT(electionId, candidateId) {
    // TODO: Implementar cuando exista endpoint
    // const response = await API.post(`/api/v1/elections/${electionId}/mint-nft`, {
    //   candidateId,
    // });
    // return response.data;
    throw new Error('[ElectionRepository.api] Not implemented - mintNFT');
  },
};

export default ElectionRepositoryApi;
