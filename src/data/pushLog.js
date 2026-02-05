
import { BACKEND } from '@env';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function usePushLog() {
  return useQuery({
    queryKey: 'pushlog',
    queryFn: () => axios.get(`${BACKEND}pushlog`)
      .then(res => res.data)
  });
}
