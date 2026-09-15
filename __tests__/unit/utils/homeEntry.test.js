import {
  consumeHomeEntryFromLogin,
  markHomeEntryFromLogin,
} from '../../../src/utils/homeEntry';

describe('homeEntry', () => {
  afterEach(() => {
    consumeHomeEntryFromLogin();
  });

  it('devuelve false cuando no se marcó la entrada desde login', () => {
    expect(consumeHomeEntryFromLogin()).toBe(false);
  });

  it('la marca de login se consume una sola vez', () => {
    markHomeEntryFromLogin();

    expect(consumeHomeEntryFromLogin()).toBe(true);
    expect(consumeHomeEntryFromLogin()).toBe(false);
  });
});
