/**
 * useCountdown Hook
 *
 * Hook para calcular y mostrar el tiempo restante para inicio/cierre de una elección.
 * Se actualiza cada minuto para optimizar rendimiento.
 */

import { useState, useEffect, useCallback } from 'react';
import { UI_STRINGS } from '../data/mockData';

/**
 * Formatea milisegundos a string legible
 * @param {number} ms - milisegundos restantes
 * @param {boolean} isStarting - si es para "Inicia en" o "Cierra en"
 * @returns {string}
 */
const formatCountdown = (ms, isStarting = false) => {
  if (ms <= 0) {
    return isStarting ? '' : 'Cerrada';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const prefix = isStarting ? UI_STRINGS.startsIn : UI_STRINGS.closesIn;

  if (days > 0) {
    return `${prefix} ${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${prefix} ${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${prefix} ${minutes}m`;
  }

  return `${prefix} <1m`;
};

/**
 * @param {Object} election - Datos de la elección
 * @param {number|null} election.startsAt - Timestamp de inicio (null si ya empezó)
 * @param {number} election.closesAt - Timestamp de cierre
 * @param {number} [updateInterval=60000] - Intervalo de actualización en ms (default: 1 minuto)
 * @returns {{
 *   countdownLabel: string,
 *   isStarting: boolean,
 *   isEnded: boolean,
 *   remainingMs: number
 * }}
 */
export const useCountdown = (election, updateInterval = 60000) => {
  const calculateState = useCallback(() => {
    const now = Date.now();

    // Si hay startsAt y aún no ha empezado
    if (election.startsAt && election.startsAt > now) {
      const remaining = election.startsAt - now;
      return {
        countdownLabel: formatCountdown(remaining, true),
        isStarting: true,
        isEnded: false,
        remainingMs: remaining,
      };
    }

    // Si ya empezó, mostrar tiempo hasta cierre
    if (election.closesAt) {
      const remaining = election.closesAt - now;
      return {
        countdownLabel: formatCountdown(remaining, false),
        isStarting: false,
        isEnded: remaining <= 0,
        remainingMs: remaining,
      };
    }

    // Fallback: usar label estático si no hay timestamps
    return {
      countdownLabel: election.closesInLabel || '',
      isStarting: false,
      isEnded: false,
      remainingMs: 0,
    };
  }, [election]);

  const [state, setState] = useState(calculateState);

  useEffect(() => {
    // Actualizar inmediatamente
    setState(calculateState());

    // Configurar intervalo de actualización
    const interval = setInterval(() => {
      setState(calculateState());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [calculateState, updateInterval]);

  return state;
};

export default useCountdown;
