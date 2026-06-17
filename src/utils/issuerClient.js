export function normalizeOcrForUI(src = {}) {
  const fullName =
    src.fullName?.trim?.() ||
    src.full_name?.trim?.() ||
    src.name?.trim?.() ||
    '';

  const governmentIdentifier = (
    src.governmentIdentifier ??
    src.numeroDoc ??
    src.nationalIdNumber ??
    ''
  )
    .toString()
    .replace(/\D/g, '');

  let dateOfBirth = src.dateOfBirth;
  if (!(typeof dateOfBirth === 'number' && Number.isFinite(dateOfBirth))) {
    const iso =
      src.fechaNacimiento || src.birthDateISO || src.dateOfBirthISO || null;
    const t = iso ? Date.parse(iso) : NaN;
    dateOfBirth = Number.isFinite(t) ? Math.floor(t / 1000) : null;
  }

  return {fullName, governmentIdentifier, dateOfBirth};
}
