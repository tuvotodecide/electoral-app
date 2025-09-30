/*
 * Configuración compartida de mocks para los tests de RecordReviewScreen.
 */

jest.mock('react-redux', () => jest.requireActual('../../../__mocks__/react-redux'));

jest.mock('@react-navigation/native', () =>
	jest.requireActual('../../../__mocks__/@react-navigation/native'),
);

jest.mock(
	'../../../../src/components/common/BaseRecordReviewScreen',
	() => require('../../../__mocks__/components/common/BaseRecordReviewScreen').default,
);

jest.mock(
	'../../../../src/i18n/String',
	() => require('../../../__mocks__/String').default,
);
