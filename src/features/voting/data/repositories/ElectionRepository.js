/**
 * Election Repository Interface
 *
 * Define la interfaz para interactuar con datos de elecciones.
 * La UI no debe saber si es mock o API real.
 *
 * @typedef {Object} Election
 * @property {string} id
 * @property {string} title
 * @property {string} status
 * @property {string} closesInLabel
 * @property {string} instituteName
 *
 * @typedef {Object} Candidate
 * @property {string} id
 * @property {string} partyName
 * @property {string} presidentName
 * @property {string} viceName
 * @property {{roleName: string, name: string}[]} [ticketEntries]
 * @property {string|null} avatarUrl
 * @property {string} partyColor
 *
 * @typedef {Object} VoteResult
 * @property {boolean} success
 * @property {string} [transactionId]
 * @property {string} [error]
 *
 * @typedef {Object} IElectionRepository
 * @property {() => Promise<Election[]>} [getElections]
 * @property {() => Promise<Election>} getElection
 * @property {(electionId: string) => Promise<Candidate[]>} getCandidates
 * @property {(electionId: string, candidateId: string) => Promise<VoteResult>} [registerParticipation]
 * @property {(electionId: string, candidateId: string) => Promise<VoteResult>} submitVote
 */

/**
 * Crear instancia del repositorio
 * Este archivo solo exporta la interfaz/tipos. La implementación está en .mock.js y .api.js
 */

export const REPOSITORY_TYPES = {
  MOCK: 'mock',
  API: 'api',
};

export default {
  REPOSITORY_TYPES,
};
