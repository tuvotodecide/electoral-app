import {
  INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH,
  INSTITUTIONAL_AUTHORIZATION_WALLET_MISMATCH,
  assertInstitutionalAuthorizationExecutionMatches,
  assertInstitutionalSignerWallet,
  isInstitutionalAuthorizationExpired,
} from '../../../../src/features/institutionalAuthorization/utils/institutionalAuthorizationRules';

describe('institutionalAuthorizationRules', () => {
  const signerWallet = '0x1111111111111111111111111111111111111111';
  const targetWallet = '0x2222222222222222222222222222222222222222';
  const stableInstitutionId = 'tenant-stable-1';
  const applicationId = 'application-1';
  const request = {
    applicationId,
    stableInstitutionId,
    signerWallet,
    targetWallet,
  };
  const claim = {
    request: {applicationId},
    execution: {
      action: 'ADD_AUTHORIZED_ADDRESS',
      stableInstitutionId,
      signerWallet,
      targetWallet,
      calls: [{
        target: '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb',
        value: '0',
        callData: '0x1234',
        purpose: 'ADD_AUTHORIZED_ADDRESS',
      }],
    },
  };

  it('valida la operación institucional preparada sin usar applicationId como ID estable', () => {
    expect(
      assertInstitutionalAuthorizationExecutionMatches({
        request,
        claim,
        expectedSmartAccount: signerWallet,
      }).calls,
    ).toEqual(claim.execution.calls);
  });

  it('bloquea billetera firmante incorrecta', () => {
    let thrown;
    try {
      assertInstitutionalSignerWallet(
        signerWallet,
        '0x3333333333333333333333333333333333333333',
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      code: INSTITUTIONAL_AUTHORIZATION_WALLET_MISMATCH,
    });
  });

  it('bloquea datos alterados antes de firmar', () => {
    let thrown;
    try {
      assertInstitutionalAuthorizationExecutionMatches({
        request,
        claim: {
          ...claim,
          execution: {
            ...claim.execution,
            targetWallet: '0x3333333333333333333333333333333333333333',
          },
        },
        expectedSmartAccount: signerWallet,
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      code: INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH,
    });
  });

  it('D-REV-003: valida paquete de eliminación con la misma regla de integridad', () => {
    const removeRequest = {
      ...request,
      action: 'REMOVE_AUTHORIZED_ADDRESS',
    };
    const removeClaim = {
      request: {applicationId},
      execution: {
        ...claim.execution,
        action: 'REMOVE_AUTHORIZED_ADDRESS',
        calls: [{
          ...claim.execution.calls[0],
          callData: '0x5678',
          purpose: 'REMOVE_AUTHORIZED_ADDRESS',
        }],
      },
    };

    expect(
      assertInstitutionalAuthorizationExecutionMatches({
        request: removeRequest,
        claim: removeClaim,
        expectedSmartAccount: signerWallet,
      }).calls,
    ).toEqual(removeClaim.execution.calls);
  });

  it('bloquea acción contractual alterada antes de firmar', () => {
    let thrown;
    try {
      assertInstitutionalAuthorizationExecutionMatches({
        request: {...request, action: 'REMOVE_AUTHORIZED_ADDRESS'},
        claim,
        expectedSmartAccount: signerWallet,
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      code: INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH,
    });
  });

  it('bloquea uso de applicationId como identificador institucional', () => {
    let thrown;
    try {
      assertInstitutionalAuthorizationExecutionMatches({
        request: {...request, stableInstitutionId: applicationId},
        claim: {
          ...claim,
          execution: {...claim.execution, stableInstitutionId: applicationId},
        },
        expectedSmartAccount: signerWallet,
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      code: INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH,
    });
  });

  it('detecta vencimiento por estado o fecha', () => {
    expect(isInstitutionalAuthorizationExpired({
      status: 'MOBILE_AUTHORIZATION_EXPIRED',
    })).toBe(true);
    expect(isInstitutionalAuthorizationExpired({
      status: 'PENDING_MOBILE_AUTHORIZATION',
      expiresAt: '2020-01-01T00:00:00.000Z',
    })).toBe(true);
    expect(isInstitutionalAuthorizationExpired({
      status: 'PENDING_MOBILE_AUTHORIZATION',
      expiresAt: '2099-01-01T00:00:00.000Z',
    })).toBe(false);
  });
});
