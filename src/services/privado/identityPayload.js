import {getPrivadoClient} from './privadoSession';
import {getIdentityCredentialType} from './privadoConfig';

/** No hay identidad (DID) guardada en este dispositivo. */
export class IdentityNotFoundError extends Error {
  constructor() {
    super('No hay una identidad guardada en este dispositivo.');
    this.name = 'IdentityNotFoundError';
  }
}

/** La identidad existe, pero falta la credencial de identidad (o venció). */
export class IdentityCredentialMissingError extends Error {
  constructor(type, foundTypes = []) {
    super(
      `No se encontró la credencial ${type}` +
        (foundTypes.length ? `: solo hay ${foundTypes.join(', ')}` : ''),
    );
    this.name = 'IdentityCredentialMissingError';
    this.credentialType = type;
  }
}

const present = value => value !== undefined && value !== null && value !== '';

/**
 * Añade al `credentialSubject` los nombres de campo de la credencial anterior,
 * que la app sigue leyendo (sin pisar los que ya vengan):
 * - `governmentIdentifier` y `documentNumber` ← `nationalIdNumber`
 * - `dateOfBirth` ← `birthDate` (segundos Unix)
 */
export function withLegacySubjectFields(credential) {
  const subject = credential?.credentialSubject;
  if (!subject || typeof subject !== 'object') {
    return credential;
  }
  const aliases = {};
  if (present(subject.nationalIdNumber)) {
    if (!present(subject.governmentIdentifier)) {
      aliases.governmentIdentifier = subject.nationalIdNumber;
    }
    if (!present(subject.documentNumber)) {
      aliases.documentNumber = subject.nationalIdNumber;
    }
  }
  if (present(subject.birthDate) && !present(subject.dateOfBirth)) {
    aliases.dateOfBirth = subject.birthDate;
  }
  return {...credential, credentialSubject: {...subject, ...aliases}};
}

/**
 * Datos de la cuenta para `state.wallet.payload` tras desbloquear el vault:
 * `{did, account, dni, vc}`. La VC es la credencial de identidad más
 * reciente (PRIVADO_IDENTITY_CREDENTIAL_TYPE), con los campos mapeados.
 * Descifrar la VC necesita el vault abierto.
 */
export async function loadIdentityPayload() {
  const client = await getPrivadoClient();
  const holder = await client.getHolderDid();
  if (!holder) {
    throw new IdentityNotFoundError();
  }

  const type = getIdentityCredentialType();
  const credential = await client.getCredentialByType(type);
  if (!credential) {
    const found = (await client.getCredentials()).flatMap(summary =>
      summary.type.filter(t => t !== 'VerifiableCredential'),
    );
    throw new IdentityCredentialMissingError(type, [...new Set(found)]);
  }

  const vc = withLegacySubjectFields(credential);
  return {
    did: holder.did,
    account: holder.wallet?.address ?? null,
    dni: vc.credentialSubject?.nationalIdNumber ?? null,
    vc,
  };
}
