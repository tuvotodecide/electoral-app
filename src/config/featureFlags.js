/**
 * Feature Flags - Centralized feature toggle configuration
 *
 * IMPORTANTE: Estos flags permiten activar/desactivar features sin modificar código.
 * Cuando ENABLE_UNIVERSITY_ELECTION = false, la app se comporta exactamente igual que antes.
 */

export const FEATURE_FLAGS = {
  /**
   * Habilita el flujo de Elecciones Universitarias
   * - Card en Home
   * - Pantalla de candidatos
   * - Votación con NFT
   * - Cola offline
   *
   * Para desactivar: cambiar a false
   */
  ENABLE_UNIVERSITY_ELECTION: true,
};

/**
 * Helper para verificar si un feature está habilitado
 * @param {keyof typeof FEATURE_FLAGS} flagName
 * @returns {boolean}
 */
export const isFeatureEnabled = (flagName) => {
  return FEATURE_FLAGS[flagName] === true;
};

/**
 * Solo para desarrollo: permite forzar estado offline en el feature de votación
 * NO usar en producción
 */
export const DEV_FLAGS = {
  FORCE_OFFLINE_UNIVERSITY_ELECTION: true,
  /**
   * Habilita el countdown dinámico en la tarjeta de elección
   * true = usa timestamps reales para countdown
   * false = usa labels estáticos del mock
   */
  ENABLE_DYNAMIC_COUNTDOWN: true,
  /**
   * Fuerza el estado de "no ha votado" para poder probar el flujo de votación
   * true = siempre muestra que el usuario NO ha votado
   * false = usa el estado real del storage
   */
  FORCE_HAS_NOT_VOTED: true,
  /**
   * Fuerza el estado "no habilitado" para probar el card inhabilitado (foto 11)
   * true = muestra "Usted no está habilitado para participar"
   * false = usa el estado real
   */
  FORCE_NOT_ELIGIBLE: false,
  /**
   * Fuerza que la elección "aún no empezó" para probar countdown de inicio (foto 12)
   * Valor en minutos desde ahora. Ej: 180 = inicia en 3 horas
   * 0 = desactivado, usa el estado real
   */
  FORCE_STARTS_IN_MINUTES: 0,
};
