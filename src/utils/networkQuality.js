export const NET_POLICIES = {
  estrict:  { minWifiPercent: 35, minWifiBars: 2, minWifiRssi: -80, minCellGen: '4g' },
  balanced:{ minWifiPercent: 25, minWifiBars: 2, minWifiRssi: -85, minCellGen: '3g' },
  tolerant: { minWifiPercent: 20, minWifiBars: 1, minWifiRssi: -90, minCellGen: '3g' },
};

export const isStateEffectivelyOnline = (
  state,
  {
    minWifiPercent = 25, // si te llega porcentaje (0–100)
    minWifiBars = 2, // si te llegan barras (0–4)
    minCellGen = '3g', // mínimo para celular
    minWifiRssi = -85, // umbral de RSSI (dBm) cuando strength es negativo
    allowExpensive = true, // ignora redes /metered? 
  } = {},
) => {
  if (!state?.isConnected) return false;
  if (state.isInternetReachable !== true) return false;

  const type = state.type;
  const d = state.details || {};

  if (type === 'wifi') {
    
    const raw =
      typeof d.strength === 'number'
        ? d.strength
        : typeof d.signalStrength === 'number'
        ? d.signalStrength
        : undefined;

    if (typeof raw === 'number') {
      if (raw >= 0) {
       
        if (raw <= 4) {
          if (raw < minWifiBars) return false; 
        } else {
          if (raw < minWifiPercent) return false;
        }
      } else {
       
        if (raw <= minWifiRssi) return false;
      }
    }
    if (d.isConnectionExpensive && allowExpensive === false) return false;
  }

  if (type === 'cellular') {
    const order = {unknown: 0, '2g': 1, '3g': 2, '4g': 3, '5g': 4};
    const g = String(d.cellularGeneration || 'unknown').toLowerCase();
    const need = String(minCellGen).toLowerCase();
    if ((order[g] || 0) < (order[need] || 2)) return false;
  }

  return true;
};

export const isEffectivelyOnline = async (NetInfo, opts) => {
  const state = await NetInfo.fetch();
  return isStateEffectivelyOnline(state, opts);
};
