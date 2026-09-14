import {useEffect, useState} from 'react';
import {BACKEND_IDENTITY, CRED_SCHEMA_URL} from '@env';

// 'loading' | 'ok' | 'unavailable'
export const useServiceStatus = () => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${BACKEND_IDENTITY}${CRED_SCHEMA_URL}`, {
      method: 'GET',
      signal: controller.signal,
    })
      .then(response => setStatus(response.ok ? 'ok' : 'unavailable'))
      .catch(error => {
        if (error?.name !== 'AbortError') {
          setStatus('unavailable');
        }
      });

    return () => controller.abort();
  }, []);

  return status;
};

export default useServiceStatus;
