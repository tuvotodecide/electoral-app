/**
 * useCountdown Hook
 *
 * Hook para calcular y mostrar el tiempo restante para inicio/cierre de una elección.
 * Se actualiza cada segundo cuando es "Inicia en" para mostrar HH:MM:SS.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UI_STRINGS } from '../data/mockData';
import { DEV_FLAGS } from '../../../config/featureFlags';

/**
 * Formatea milisegundos a HH:MM:SS
 * @param {number} ms - milisegundos restantes
 * @returns {string} formato "HH:MM:SS"
 */
const formatToHHMMSS = (ms) => {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Formatea milisegundos a string legible (para "Cierra en")
 * @param {number} ms - milisegundos restantes
 * @returns {string}
 */
const formatCountdownShort = (ms) => {
  if (ms <= 0) return 'Cerrada';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${UI_STRINGS.closesIn} ${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${UI_STRINGS.closesIn} ${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${UI_STRINGS.closesIn} ${minutes}m`;
  }

  return `${UI_STRINGS.closesIn} <1m`;
};

/**
 * @param {Object} election - Datos de la elección
 * @param {number|null} election.startsAt - Timestamp de inicio (null si ya empezó)
 * @param {number} election.closesAt - Timestamp de cierre
 * @returns {{
 *   countdownLabel: string,
 *   countdownTime: string,
 *   isStarting: boolean,
 *   isEnded: boolean,
 *   remainingMs: number
 * }}
 */
export const useCountdown = (election) => {
  // DEV_FLAG: Forzar "inicia en X minutos"
  const effectiveStartsAt = useMemo(() => {
    if (DEV_FLAGS.FORCE_STARTS_IN_MINUTES > 0) {
      return Date.now() + DEV_FLAGS.FORCE_STARTS_IN_MINUTES * 60 * 1000;
    }
    return election.startsAt;
  }, [election.startsAt]);

  const calculateState = useCallback(() => {
    const now = Date.now();

    // Si hay startsAt y aún no ha empezado
    if (effectiveStartsAt && effectiveStartsAt > now) {
      const remaining = effectiveStartsAt - now;
      return {
        countdownLabel: UI_STRINGS.startsIn,
        countdownTime: formatToHHMMSS(remaining),
        isStarting: true,
        isEnded: false,
        remainingMs: remaining,
      };
    }

    // Si ya empezó, mostrar tiempo hasta cierre
    if (election.closesAt) {
      const remaining = election.closesAt - now;
      return {
        countdownLabel: formatCountdownShort(remaining),
        countdownTime: '',
        isStarting: false,
        isEnded: remaining <= 0,
        remainingMs: remaining,
      };
    }

    // Fallback: usar label estático si no hay timestamps
    return {
      countdownLabel: election.closesInLabel || '',
      countdownTime: '',
      isStarting: false,
      isEnded: false,
      remainingMs: 0,
    };
  }, [effectiveStartsAt, election.closesAt, election.closesInLabel]);

  const [state, setState] = useState(calculateState);

  useEffect(() => {
    // Actualizar inmediatamente
    setState(calculateState());

    // Intervalo: 1 segundo si "Inicia en", 60 segundos si "Cierra en"
    const interval = setInterval(() => {
      const newState = calculateState();
      setState(newState);
    }, state.isStarting ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [calculateState, state.isStarting]);

  return state;
};

export default useCountdown;
