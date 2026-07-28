import {
  decodeFunctionData,
  encodeAbiParameters,
  getAddress,
  isAddress,
  isHex,
  keccak256,
} from 'viem';

export const OFFICIAL_PUBLICATION_CALLDATA_MISMATCH =
  'OFFICIAL_PUBLICATION_CALLDATA_MISMATCH';

const TVD_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      {name: 'spender', type: 'address'},
      {name: 'amount', type: 'uint256'},
    ],
    outputs: [{name: '', type: 'bool'}],
  },
];

const throwPackageMismatch = message => {
  const error = new Error(message || 'El paquete preparado no coincide con la solicitud');
  error.code = OFFICIAL_PUBLICATION_CALLDATA_MISMATCH;
  throw error;
};

export const buildOfficialPublicationCallDataHash = ({
  targetAddress,
  value,
  callData,
}) => {
  if (!isAddress(targetAddress) || !isHex(callData, {strict: true})) {
    throwPackageMismatch();
  }

  return keccak256(
    encodeAbiParameters(
      [
        {type: 'address', name: 'targetAddress'},
        {type: 'uint256', name: 'value'},
        {type: 'bytes32', name: 'callDataDigest'},
      ],
      [getAddress(targetAddress), BigInt(value || 0), keccak256(callData)],
    ),
  );
};

export const buildOfficialPublicationCallsHash = ({
  chainId,
  smartAccountAddress,
  calls,
}) => {
  if (!isAddress(smartAccountAddress) || !Array.isArray(calls) || !calls.length) {
    throwPackageMismatch();
  }
  return keccak256(
    encodeAbiParameters(
      [
        {type: 'uint256', name: 'chainId'},
        {type: 'address', name: 'smartAccountAddress'},
        {
          type: 'tuple[]',
          name: 'calls',
          components: [
            {type: 'address', name: 'target'},
            {type: 'uint256', name: 'value'},
            {type: 'bytes32', name: 'callDataDigest'},
          ],
        },
      ],
      [
        BigInt(chainId),
        getAddress(smartAccountAddress),
        calls.map(call => {
          if (!isAddress(call.target) || !isHex(call.callData, {strict: true})) {
            throwPackageMismatch();
          }
          return {
            target: getAddress(call.target),
            value: BigInt(call.value || 0),
            callDataDigest: keccak256(call.callData),
          };
        }),
      ],
    ),
  );
};

const assertBatchPolicy = (execution, calls) => {
  if (calls.length === 1) {
    const [createVoteCall] = calls;
    if (createVoteCall.purpose !== 'CREATE_VOTE') {
      throwPackageMismatch();
    }
    if (
      execution.targetAddress &&
      getAddress(createVoteCall.target) !== getAddress(execution.targetAddress)
    ) {
      throwPackageMismatch();
    }
    return;
  }

  if (calls.length !== 2) {
    throwPackageMismatch();
  }

  const [approvalCall, createVoteCall] = calls;
  if (
    approvalCall.purpose !== 'TVD_APPROVAL' ||
    createVoteCall.purpose !== 'CREATE_VOTE' ||
    BigInt(approvalCall.value || 0) !== 0n ||
    BigInt(createVoteCall.value || 0) !== BigInt(execution.value || 0)
  ) {
    throwPackageMismatch();
  }

  if (
    execution.targetAddress &&
    getAddress(createVoteCall.target) !== getAddress(execution.targetAddress)
  ) {
    throwPackageMismatch();
  }

  if (execution.callData && createVoteCall.callData !== execution.callData) {
    throwPackageMismatch();
  }

  if (!isAddress(execution.spenderAddress)) {
    throwPackageMismatch();
  }

  let decoded;
  try {
    decoded = decodeFunctionData({
      abi: TVD_APPROVE_ABI,
      data: approvalCall.callData,
    });
  } catch {
    throwPackageMismatch();
  }

  if (
    decoded.functionName !== 'approve' ||
    getAddress(decoded.args[0]) !== getAddress(execution.spenderAddress) ||
    BigInt(decoded.args[1]) !== BigInt(execution.walletDebitRequired || 0)
  ) {
    throwPackageMismatch();
  }
};

export const assertOfficialPublicationExecutionMatches = ({
  request,
  claim,
  expectedSmartAccount,
}) => {
  if (!claim?.execution || claim.requestId !== request.requestId) {
    const error = new Error('La respuesta de confirmacion no corresponde a la solicitud');
    error.code = OFFICIAL_PUBLICATION_CALLDATA_MISMATCH;
    throw error;
  }

  const execution = claim.execution;
  const expectedChain = Number(request.chainId);
  if (Number(execution.chainId) !== expectedChain) {
    const error = new Error('La red preparada no coincide con la solicitud');
    error.code = OFFICIAL_PUBLICATION_CALLDATA_MISMATCH;
    throw error;
  }

  const expected = String(
    request.smartAccountAddress || request.signerWallet || '',
  ).toLowerCase();
  const actual = String(expectedSmartAccount || '').toLowerCase();
  if (expected && actual && expected !== actual) {
    const error = new Error('La cuenta institucional no coincide');
    error.code = 'OFFICIAL_PUBLICATION_WALLET_MISMATCH';
    throw error;
  }

  const calls = Array.isArray(execution.calls) && execution.calls.length
    ? execution.calls
    : [{
        target: execution.targetAddress,
        value: execution.value,
        callData: execution.callData,
        purpose: 'CREATE_VOTE',
      }];

  assertBatchPolicy(execution, calls);

  const calculated = execution.callsHash
    ? buildOfficialPublicationCallsHash({
        chainId: execution.chainId,
        smartAccountAddress: execution.smartAccountAddress || expected,
        calls,
      })
    : buildOfficialPublicationCallDataHash({
        targetAddress: execution.targetAddress,
        value: execution.value,
        callData: execution.callData,
      });

  const expectedHash = execution.callsHash || execution.callDataHash;
  if (calculated.toLowerCase() !== String(expectedHash).toLowerCase()) {
    const error = new Error('El paquete preparado no coincide con su hash');
    error.code = OFFICIAL_PUBLICATION_CALLDATA_MISMATCH;
    throw error;
  }

  return {hash: calculated, calls};
};
