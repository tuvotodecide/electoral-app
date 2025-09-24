import { useMutation } from 'react-query';
import { registryCheckByDni } from '../api/registry';


export function useCheckDni() {
  return useMutation({
    mutationFn: async ({ identifier }) => {
      const { exists, discoverableHash } = await registryCheckByDni(identifier);
      return { ok: exists, exists, discoverableHash };
    },
  });
}
