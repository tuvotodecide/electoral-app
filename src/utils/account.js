import axios from "axios";
import { computeAccountAddress } from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { walletConfig } from "./constants";
import { BACKEND_RESULT } from "@env";
import { authenticateWithBackend } from "@/src/utils/offlineQueueHandler";

export function predictSmartAccount(chain, privateKey, salt) {
  // si te llega undefined salt, crea uno aleatorio
  const index =
    salt ??
    crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((acc, v) => (acc << 8n) + BigInt(v), 0n);

  const owner = privateKeyToAccount(privateKey).address;

  const address = computeAccountAddress({
    factoryAddress: walletConfig[chain].factory,
    entryPointAddress: walletConfig[chain].entryPoint,
    owner,
    index,
  });

  return { address, salt: index };
}

export async function claimRegisterRewardIfAvailable(address, did, privKey) {
  const apikey = await authenticateWithBackend(did, privKey);

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
