export function getCredentialSubjectFromPayload(payload) {
  const vc = payload?.vc?.vc || payload?.vc;
  return vc?.credentialSubject ?? null;
}