/**
 * Mock Implementation of Election Repository
 *
 * Implementación simulada para desarrollo y demo.
 * Cuando exista backend real, se reemplazará por ElectionRepository.api.js
 */

import { MOCK_ELECTION, MOCK_CANDIDATES } from '../mockData';

/**
 * Simula delay de red
 * @param {number} ms
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Election Repository
 */
const ElectionRepositoryMock = {
  /**
   * Obtiene información de la elección actual
   * @returns {Promise<import('./ElectionRepository').Election>}
   */
  async getElection() {
    await delay(300);
    return { ...MOCK_ELECTION };
  },

  /**
   * Obtiene lista de candidatos para una elección
   * @param {string} electionId
   * @returns {Promise<import('./ElectionRepository').Candidate[]>}
   */
  async getCandidates(electionId) {
    await delay(400);

    if (electionId !== MOCK_ELECTION.id) {
      throw new Error('Election not found');
    }

    return [...MOCK_CANDIDATES];
  },

  /**
   * Envía voto (simulado)
   * @param {string} electionId
   * @param {string} candidateId
   * @returns {Promise<import('./ElectionRepository').VoteResult>}
   */
  async submitVote(electionId, candidateId) {
    await delay(800);

    // Validaciones
    if (electionId !== MOCK_ELECTION.id) {
      return {
        success: false,
        error: 'Election not found',
      };
    }

    const candidate = MOCK_CANDIDATES.find((c) => c.id === candidateId);
    if (!candidate) {
      return {
        success: false,
        error: 'Candidate not found',
      };
    }

    // Simular éxito
    const transactionId = `tx_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;

    return {
      success: true,
      transactionId,
    };
  },

  /**
   * Genera NFT de participación (simulado)
   * @param {string} electionId
   * @param {string} candidateId
   * @returns {Promise<{nftId: string, imageUrl: string}>}
   */
  async mintNFT(electionId, candidateId) {
    await delay(600);

    const nftId = `nft_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;

    return {
      nftId,
      imageUrl: null, // En implementación real, esto sería una URL a la imagen del NFT
      metadata: {
        electionId,
        candidateId,
        timestamp: Date.now(),
        type: 'participation',
      },
    };
  },
};

export default ElectionRepositoryMock;
