export function validateBallotLocally(
  partyResults = [],
  voteSummaryResults = [],
) {
  const errors = [];

  const asInt = v => {
    const n = parseInt(String(v ?? '0'), 10);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  };

  const row = id => voteSummaryResults.find(r => r.id === id) || {};
  const vPres = asInt(row('validos').value1);
  const bPres = asInt(row('blancos').value1);
  const nPres = asInt(row('nulos').value1);
  // const vDip = asInt(row('validos').value2);
  // const bDip = asInt(row('blancos').value2);
  // const nDip = asInt(row('nulos').value2);

  if ([vPres, bPres, nPres].some(Number.isNaN)) {
    errors.push(
      'Hay valores inválidos en el resumen (usa números enteros ≥ 0).',
    );
  }

  const sumPres = partyResults.reduce((acc, p) => acc + asInt(p.presidente), 0);
  // const sumDip = partyResults.reduce((acc, p) => acc + asInt(p.diputado), 0);

  if (partyResults.some(p => Number.isNaN(asInt(p.presidente)))) {
    errors.push('Los votos por partido deben ser números enteros ≥ 0.');
  }

  if (!Number.isNaN(sumPres) && !Number.isNaN(vPres) && sumPres !== vPres) {
    errors.push(
      `Presidentes: la suma por partido (${sumPres}) no coincide con Válidos (${vPres}).`,
    );
  }


  return {ok: errors.length === 0, errors};
}
