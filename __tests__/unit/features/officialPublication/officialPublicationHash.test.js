import {encodeFunctionData} from 'viem';

import {
  assertOfficialPublicationExecutionMatches,
  buildOfficialPublicationCallsHash,
  buildOfficialPublicationCallDataHash,
  OFFICIAL_PUBLICATION_CALLDATA_MISMATCH,
} from '../../../../src/features/officialPublication/utils/officialPublicationHash';

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

describe('officialPublicationHash', () => {
  const targetAddress = '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb';
  const smartAccountAddress = '0x1111111111111111111111111111111111111111';
  const spenderAddress = '0xbb4ea03105e2d883ab234d95f10dc7cc5000bb40';
  const callData = '0x12345678';

  it('calcula un hash canonico estable y sensible a target, value y data', () => {
    const base = buildOfficialPublicationCallDataHash({
      targetAddress,
      value: '0',
      callData,
    });

    expect(
      buildOfficialPublicationCallDataHash({
        targetAddress: targetAddress.toLowerCase(),
        value: 0n,
        callData,
      }),
    ).toBe(base);
    expect(
      buildOfficialPublicationCallDataHash({
        targetAddress: '0xbb4ea03105e2d883ab234d95f10dc7cc5000bb40',
        value: '0',
        callData,
      }),
    ).not.toBe(base);
    expect(
      buildOfficialPublicationCallDataHash({
        targetAddress,
        value: '1',
        callData,
      }),
    ).not.toBe(base);
    expect(
      buildOfficialPublicationCallDataHash({
        targetAddress,
        value: '0',
        callData: '0x12345679',
      }),
    ).not.toBe(base);
  });

  it('bloquea firma si el paquete preparado no coincide', () => {
    const hash = buildOfficialPublicationCallDataHash({
      targetAddress,
      value: '0',
      callData,
    });
    const alteredHash = `${hash.slice(0, -1)}${hash.endsWith('0') ? '1' : '0'}`;

    expect(
      assertOfficialPublicationExecutionMatches({
        request: {
          requestId: 'req-1',
          chainId: 84532,
          smartAccountAddress,
        },
        claim: {
          requestId: 'req-1',
          execution: {
            chainId: 84532,
            targetAddress,
            value: '0',
            callData,
            callDataHash: hash,
          },
        },
        expectedSmartAccount: smartAccountAddress,
      }).hash,
    ).toBe(hash);

    let thrown;
    try {
      assertOfficialPublicationExecutionMatches({
        request: {
          requestId: 'req-1',
          chainId: 84532,
          smartAccountAddress,
        },
        claim: {
          requestId: 'req-1',
          execution: {
            chainId: 84532,
            targetAddress,
            value: '0',
            callData,
            callDataHash: alteredHash,
          },
        },
        expectedSmartAccount: smartAccountAddress,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      code: OFFICIAL_PUBLICATION_CALLDATA_MISMATCH,
    });
  });

  it('calcula y valida hash canonico de batch sensible al orden y monto', () => {
    const calls = [
      {
        target: '0x0156D96BAbC74139a5cdb2cf2C90FDA1F6B53562',
        value: '0',
        callData: encodeFunctionData({
          abi: TVD_APPROVE_ABI,
          functionName: 'approve',
          args: [spenderAddress, 1000000000000000000n],
        }),
        purpose: 'TVD_APPROVAL',
      },
      {
        target: targetAddress,
        value: '0',
        callData,
        purpose: 'CREATE_VOTE',
      },
    ];
    const hash = buildOfficialPublicationCallsHash({
      chainId: 84532,
      smartAccountAddress,
      calls,
    });

    expect(
      buildOfficialPublicationCallsHash({
        chainId: 84532,
        smartAccountAddress,
        calls: [...calls].reverse(),
      }),
    ).not.toBe(hash);

    const result = assertOfficialPublicationExecutionMatches({
      request: {
        requestId: 'req-1',
        chainId: 84532,
        smartAccountAddress,
      },
      claim: {
        requestId: 'req-1',
        execution: {
          chainId: 84532,
          smartAccountAddress,
          targetAddress,
          value: '0',
          callData,
          spenderAddress,
          walletDebitRequired: '1000000000000000000',
          calls,
          callsHash: hash,
        },
      },
      expectedSmartAccount: smartAccountAddress,
    });

    expect(result.hash).toBe(hash);
    expect(result.calls).toEqual(calls);
  });

  it('bloquea createVote sin approve cuando hay TVD requerido', () => {
    const hash = buildOfficialPublicationCallDataHash({
      targetAddress,
      value: '0',
      callData,
    });

    expect(() =>
      assertOfficialPublicationExecutionMatches({
        request: {
          requestId: 'req-1',
          chainId: 84532,
          smartAccountAddress,
        },
        claim: {
          requestId: 'req-1',
          execution: {
            chainId: 84532,
            targetAddress,
            value: '0',
            callData,
            callDataHash: hash,
            walletDebitRequired: '1000000000000000000',
          },
        },
        expectedSmartAccount: smartAccountAddress,
      }),
    ).toThrow(/paquete preparado/i);
  });

  it('bloquea batch si el approve no usa TVDCredits o el monto congelado', () => {
    const calls = [
      {
        target: '0x0156D96BAbC74139a5cdb2cf2C90FDA1F6B53562',
        value: '0',
        callData: encodeFunctionData({
          abi: TVD_APPROVE_ABI,
          functionName: 'approve',
          args: ['0x2222222222222222222222222222222222222222', 1000000000000000000n],
        }),
        purpose: 'TVD_APPROVAL',
      },
      {
        target: targetAddress,
        value: '0',
        callData,
        purpose: 'CREATE_VOTE',
      },
    ];
    const hash = buildOfficialPublicationCallsHash({
      chainId: 84532,
      smartAccountAddress,
      calls,
    });

    expect(() =>
      assertOfficialPublicationExecutionMatches({
        request: {
          requestId: 'req-1',
          chainId: 84532,
          smartAccountAddress,
        },
        claim: {
          requestId: 'req-1',
          execution: {
            chainId: 84532,
            smartAccountAddress,
            targetAddress,
            value: '0',
            callData,
            spenderAddress,
            walletDebitRequired: '1000000000000000000',
            calls,
            callsHash: hash,
          },
        },
        expectedSmartAccount: smartAccountAddress,
      }),
    ).toThrow(/paquete preparado/i);
  });
});
