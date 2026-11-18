import axios from "axios";
import { BACKEND_RESULT } from "@env";
import { authenticateWithBackend } from "@/src/utils/offlineQueueHandler";

/**
 * Reclama la recompensa de registro para `address`. La autenticación con el
 * verificador la hace el SDK de Privado ID con el titular guardado (vault).
 */
export async function claimRegisterRewardIfAvailable(address) {
  const apikey = await authenticateWithBackend();

  const response = await axios.post(
    `${BACKEND_RESULT}/api/v1/users/reward-new-user`,
    {},
    {
      params: { recipient: address },
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apikey,
      },
    },
  );

  return response.data;
}
