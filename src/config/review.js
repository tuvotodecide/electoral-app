export const REVIEW_DNI = '927643154';  // número que escribirá el revisor

/** secrets ficticios para navegar sin KYC */
export const DEMO_SECRETS = {
  streamId: 'k2demo',
  dni: REVIEW_DNI,
  salt: '0',
  privKey: '0x' + '11'.repeat(32),
  account: '0x' + '22'.repeat(20),
  did: 'did:example:review',
};