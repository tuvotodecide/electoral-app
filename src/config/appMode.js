export const APP_FLOWS = {
  ATTESTATION: 'attestation',
  COMBINED: 'combined',
  VOTING: 'voting',
};

export const getAppFlow = () => {
  return APP_FLOWS.COMBINED;
};

export const isAttestationAppFlow = () => true;

export const isVotingAppFlow = () => true;

