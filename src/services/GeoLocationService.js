import { Platform, PermissionsAndroid } from 'react-native';

class GeoLocationService {
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(granted => {
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            reject(new Error('Permiso de ubicación denegado'));
            return;
          }
          // Note: Geolocation is commented out in original file too
          // resolve({ latitude: 0, longitude: 0 });
        });
      } else {
        // resolve({ latitude: 0, longitude: 0 });
      }
    });
  }

  calculateGeohash(latitude, longitude, precision = 7) {
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let latRange = [-90, 90];
    let lngRange = [-180, 180];
    let geohash = '';
    let even = true;
    let bit = 0;
    let ch = 0;

    while (geohash.length < precision) {
      if (even) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (longitude >= mid) {
          ch |= 1 << (4 - bit);
          lngRange[0] = mid;
        } else {
          lngRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (latitude >= mid) {
          ch |= 1 << (4 - bit);
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }

      even = !even;
      if (bit < 4) {
        bit++;
      } else {
        geohash += base32[ch];
        bit = 0;
        ch = 0;
      }
    }

    return geohash;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
  }
}

export const geoLocationService = new GeoLocationService();
