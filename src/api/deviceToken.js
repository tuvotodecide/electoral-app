import {API} from './http';

export async function saveDeviceToken(userDid, fcmToken, platform) {
  const {data} = await API.post('/device-token', {
    userDid,
    token: fcmToken,
    platform,
  });
  return data;
}
