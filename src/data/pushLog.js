
import axios from 'axios';
import { useQuery } from 'react-query';
import { BACKEND } from '@env';

export function usePushLog() {
  return useQuery('pushlog', () =>
    axios.get(`${BACKEND}pushlog`)
         .then(res => res.data)
  );
}
