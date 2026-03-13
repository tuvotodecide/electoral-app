import {APP_FLOW} from '@env';

export const APP_FLOWS = {
  ATTESTATION: 'attestation',
  VOTING: 'voting',
};

const normalizeFlow = value => String(value || '').trim().toLowerCase();

export const getAppFlow = () => {
  const flow = normalizeFlow(APP_FLOW);
  if (flow === APP_FLOWS.VOTING) {
    return APP_FLOWS.VOTING;
  }
  return APP_FLOWS.ATTESTATION;
};

export const isVotingAppFlow = () => getAppFlow() === APP_FLOWS.VOTING;

