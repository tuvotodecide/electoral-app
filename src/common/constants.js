import {Dimensions, Platform} from 'react-native';

const {width: viewportWidth, height: viewportHeight} = Dimensions.get('window');
export const deviceWidth = viewportWidth;
export const deviceHeight = viewportHeight;

let sampleHeight = 812;
let sampleWidth = 375;

const scale = viewportWidth / 375;

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isTablet = viewportHeight / viewportWidth < 1.6;

export const checkPlatform = () => {
  if (Platform.OS === 'android') {
    return 'android';
  } else {
    return 'ios';
  }
};

export function wp(percentage) {
  const value = (percentage * viewportWidth) / 100;
  return Math.round(value);
}
export function hp(percentage) {
  const value = (percentage * viewportHeight) / 100;
  return Math.round(value);
}

export function getWidth(value) {
  return (value / sampleWidth) * deviceWidth;
}

export function getHeight(value) {
  return (value / sampleHeight) * deviceHeight;
}

export function moderateScale(size) {
  const newSize = size * scale;
  return Math.round(newSize);
}

export const THEME = 'THEME';
export const ON_BOARDING = 'ON_BOARDING';
export const ACCESS_TOKEN = 'ACCESS_TOKEN';
export const USER_DATA = 'USER_DATA';
export const USER_ID = 'USER_ID';
export const SESSION = '@wIRA/SESSION';
export const TTL_MIN = 10;
export const DRAFT = '@wIRA/DRAFT';
export const DEVICE_TOKEN = 'DEVICE_TOKEN';
export const JWT_KEY = '@wIRA/JWT';
export const EXPIRES_KEY = `${JWT_KEY}_EXPIRES`;
export const PENDING_DID = 'PENDING_DID';
export const DEVICE_ID_KEY = 'DEVICE_ID';
export const PENDINGRECOVERY = 'pendingRecovery';
export const KEY = '@FIN/LOGIN_ATTEMPTS';
export const LOCK_KEY = '@FIN/LOCK_UNTIL';
export const LOCK_MS = 15 * 60_000;
export const FLAG = 'BUNDLE_MIGRATED_v2';
export const KEYCHAIN_ID = 'finline.wallet.vc';
export const FLAGS_KEY = 'FINLINE_FLAGS';
export const BIO_KEY = 'BIO_ENABLED';
export const PENDING_OWNER_ACCOUNT = 'PENDING_OWNER_ACCOUNT';
export const GUARDIAN_RECOVERY_DNI = 'GUARDIAN_RECOVERY_DNI';
export const PENDING_OWNER_GUARDIAN_CT = 'PENDING_OWNER_GUARDIAN_CT';
export const KEY_OFFLINE = '@offline_queue_v1';
export const STORAGE_KEY = 'PROVISION_V1';
export const LAST_TOPIC_KEY = 'LAST_LOCATION_TOPIC';
export const SERVICE_TMP = 'tmpRegister';
export const SERVICE_PIN = 'tmpRegisterPin';
export const ELECTION_STATUS = '@electionStatus';
export const ELECTION_ID = '@electionConfigId';

