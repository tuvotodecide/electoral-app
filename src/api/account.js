import { CHAIN } from '@env';
import { IdentityApiError, UserOperationReceiptError } from '@privado-id/expo-sdk';
import { createPublicClient, getContract, http } from 'viem';
import walletAbi from './contracts/SimpleAccount.json';
import { availableNetworks, getReadRpcUrl } from './params';
import { getPrivadoClient } from '../services/privado/privadoSession';

/**
 * Transacciones de la app: se envían como UserOperation desde la smart wallet
 * del titular con el SDK de Privado ID. La firma se hace en el vault y el
 * patrocinio pasa por el proxy del paymaster de backend-identity (solo para
 * cuentas registradas). Ya no hace falta la clave privada.
 */

const RECEIPT_WAIT_TIMEOUT_MS = 15 * 60 * 1000;
// Segunda consulta tras vencer la espera: en móvil, al volver de segundo plano
// el recibo puede existir aunque la espera haya vencido.
const RECEIPT_RECHECK_TIMEOUT_MS = 10 * 1000;

const sameAddress = (a, b) =>
  String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

/**
 * Cliente del SDK para la red `chainId` de la app. La red debe ser la del SDK
 * (PRIVADO_CHAIN_ID) y `address`, si se indica, la smart wallet del titular:
 * el SDK solo envía desde esa cuenta.
 */
async function getHolderOnChain(address, chainId) {
  const network = availableNetworks[chainId];
  if (!network) {
    throw new Error(`Red no soportada: ${chainId}`);
  }
  const client = await getPrivadoClient();
  const sdkChainId = client.config?.network?.chainId;
  if (network.chain?.id !== sdkChainId) {
    throw new Error(
      `La red ${chainId} (chainId ${network.chain?.id}) no es la del SDK (chainId ${sdkChainId}).`,
    );
  }
  const holder = await client.getHolderDid();
  const sender = holder?.wallet?.address;
  if (!sender) {
    throw new Error('No hay una smart wallet en este dispositivo.');
  }
  if (address && !sameAddress(address, sender)) {
    throw new Error('La operación debe enviarse desde la cuenta de este dispositivo.');
  }
  return {onChainZk: client.onChainZk, network, sender};
}

const toSdkCalls = callData =>
  (Array.isArray(callData) ? callData : [callData]).map(call => ({
    to: call.to,
    data: call.data || '0x',
    value: BigInt(call.value || 0),
  }));

/**
 * Errores del SDK con el `errorType` que usa la cola offline
 * (offlineQueue.classifyQueueError) y el hash de la operación si ya se envió.
 */
const toAppError = error => {
  if (error instanceof UserOperationReceiptError) {
    const wrapped = new Error(error.message);
    wrapped.name = error.timedOut
      ? 'WaitForTransactionReceiptTimeoutError'
      : 'UserOperationReceiptError';
    wrapped.errorType = 'NETWORK_TIMEOUT';
    wrapped.userOpHash = error.userOperationHash;
    wrapped.cause = error;
    return wrapped;
  }
  if (error instanceof IdentityApiError && !error.errorType) {
    const status = Number(error.status);
    if (status === 401 || status === 403) error.errorType = 'AUTH';
    else if (status === 429) error.errorType = 'RATE_LIMIT';
    else if (status >= 500) error.errorType = 'SERVER_5XX';
  }
  return error;
};

const waitForReceipt = async (onChainZk, userOperationHash) => {
  try {
    return await onChainZk.waitForUserOperationReceipt({
      userOperationHash,
      timeoutMs: RECEIPT_WAIT_TIMEOUT_MS,
    });
  } catch (error) {
    if (!(error instanceof UserOperationReceiptError) || !error.timedOut) {
      throw error;
    }
    return onChainZk.waitForUserOperationReceipt({
      userOperationHash,
      timeoutMs: RECEIPT_RECHECK_TIMEOUT_MS,
    });
  }
};

/**
 * Envía `callData` (`{to, data, value}` o una lista) en una UserOperation,
 * espera su recibo y, con `waitEvent`/`eventName`, lee el evento del bloque.
 * Devuelve `{returnData, receipt: {transactionHash, blockNumber}, userOpHash, date}`.
 */
export async function executeOperation(
  address,
  chainId,
  callData,
  waitEvent,
  eventName,
) {
  const {onChainZk, network} = await getHolderOnChain(address, chainId);

  let result;
  try {
    const {userOperationHash} = await onChainZk.sendHolderUserOperation({
      calls: toSdkCalls(callData),
    });
    result = await waitForReceipt(onChainZk, userOperationHash);
  } catch (error) {
    throw toAppError(error);
  }

  if (!result.success) {
    const reverted = new Error(
      'La operación se incluyó en la cadena, pero su ejecución falló.',
    );
    reverted.code = 'USER_OPERATION_REVERTED';
    reverted.userOpHash = result.userOperationHash;
    reverted.txHash = result.transactionHash;
    throw reverted;
  }

  const blockNumber = BigInt(result.blockNumber);
  const receipt = {transactionHash: result.transactionHash, blockNumber};

  let returnData;
  if (waitEvent && eventName) {
    returnData = await waitEvent(chainId, eventName, blockNumber);
  }

  const publicClient = createPublicClient({
    chain: network.chain,
    transport: http(getReadRpcUrl(network.chain)),
  });
  const block = await publicClient.getBlock({blockNumber});
  const date = new Date(Number(block.timestamp) * 1000);
  return {
    returnData,
    receipt,
    userOpHash: result.userOperationHash,
    date: date.toLocaleString(),
  };
}

/**
 * Envía las llamadas en una UserOperation y devuelve en cuanto el bundler la
 * acepta, sin esperar el recibo: `{userOpHash, smartAccountAddress}`. Sin
 * simulación previa: las llamadas de un lote pueden depender unas de otras y el
 * bundler ya las estima juntas.
 */
export async function sendOperationWithUserOpHash(address, chainId, callData) {
  const {onChainZk} = await getHolderOnChain(address, chainId);
  try {
    const {sender, userOperationHash} = await onChainZk.sendHolderUserOperation({
      calls: toSdkCalls(callData),
      simulate: false,
    });
    return {userOpHash: userOperationHash, smartAccountAddress: sender};
  } catch (error) {
    throw toAppError(error);
  }
}

export function getReadAccountContract(chain, address) {
  const client = createPublicClient({
    chain: availableNetworks[chain].chain,
    transport: http(getReadRpcUrl(availableNetworks[chain].chain)),
  });

  return getContract({
    address,
    abi: walletAbi,
    client: {public: client},
  });
}

export async function isWallet(address) {
  const client = createPublicClient({
    chain: availableNetworks[CHAIN].chain,
    transport: http(getReadRpcUrl(availableNetworks[CHAIN].chain)),
  });

  const wallet = getContract({
    address,
    abi: walletAbi,
    client: {public: client},
  });

  try {
    const response = await wallet.read.isThisASimpleAccountContract();
    return response;
  } catch (error) {
    return false;
  }
}

// Fetch user attestations from API
export async function fetchUserAttestations(userId) {
  const API_BASE_URL = 'http://192.168.1.16:3000/api/v1';

  try {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/attestations`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error al cargar los atestiguamientos',
    };
  }
}
