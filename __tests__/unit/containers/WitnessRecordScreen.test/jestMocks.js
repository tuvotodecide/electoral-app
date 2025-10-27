/*
 * Configuración centralizada de mocks para los tests de WitnessRecordScreen.
 * Cada mock se vincula con su contraparte en `__tests__/__mocks__`
 * para mantener consistencia y facilitar el mantenimiento.
 */

jest.mock('axios', () => jest.requireActual('../../../__mocks__/axios'));

jest.mock(
	'../../../../src/components/common/BaseSearchTableScreen',
	() => require('../../../__mocks__/components/common/BaseSearchTableScreen').default,
);

jest.mock(
	'../../../../src/components/common/CustomModal',
	() => require('../../../__mocks__/components/common/CustomModal').default,
);

jest.mock(
	'../../../../src/components/common/CText',
	() => require('../../../__mocks__/components/common/CText').default,
);

jest.mock(
	'../../../../src/hooks/useSearchTableLogic',
	() => require('../../../__mocks__/hooks/useSearchTableLogic'),
);

jest.mock(
	'../../../../src/styles/searchTableStyles',
	() => require('../../../__mocks__/styles/searchTableStyles'),
);

jest.mock(
	'../../../../src/data/mockMesas',
	() => require('../../../__mocks__/data/mockMesas'),
);

jest.mock(
	'../../../../src/i18n/String',
	() => require('../../../__mocks__/String').default,
);

jest.mock('react-redux', () => jest.requireActual('../../../__mocks__/react-redux'));

jest.mock('@react-navigation/native', () =>
	jest.requireActual('../../../__mocks__/@react-navigation/native'),
);
