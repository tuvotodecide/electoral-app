import {useQuery} from 'react-query';
import {API_ENDPOINTS} from './client/api-endpoints';
import {notificationsClient} from './client/notifications';

export const useNotificationsQuery = options => {
  const {data, error, isLoading} = useQuery(
    [API_ENDPOINTS.PUSHLOG, options],
    ({queryKey}) =>
      notificationsClient.paginated(Object.assign({}, queryKey[1])),
    {
      keepPreviousData: true,
    },
  );

  return {
    data,
    error,
    isLoading,
  };
};
