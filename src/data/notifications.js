import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from './client/api-endpoints';
import { notificationsClient } from './client/notifications';

export const useNotificationsQuery = options => {
  const {data, error, isLoading} = useQuery({
    queryKey: [API_ENDPOINTS.PUSHLOG, options],
    queryFn: ({queryKey}) =>
      notificationsClient.paginated(Object.assign({}, queryKey[1])),
    keepPreviousData: true,
  });

  return {
    data,
    error,
    isLoading,
  };
};
