const axios = require('axios');
const mesasModule = require('../../../../src/data/mockMesas');
const {useSearchTableLogic} = require('../../../../src/hooks/useSearchTableLogic');

const defaultTables = mesasModule.mockMesasData;

const buildNavigation = (overrides = {}) => ({
	navigate: jest.fn(),
	goBack: jest.fn(),
	...overrides,
});

const buildRoute = (overrides = {}) => ({
	params: {
		locationId: undefined,
		...overrides,
	},
});

const buildSearchLogicState = overrides => ({
	colors: {
		primary: '#4F9858',
		background: '#FFFFFF',
		text: '#000000',
		textSecondary: '#666666',
		primaryLight: '#E8F5E8',
	},
	searchText: '',
	setSearchText: jest.fn(),
	handleBack: jest.fn(),
	handleNotificationPress: jest.fn(),
	handleHomePress: jest.fn(),
	handleProfilePress: jest.fn(),
	...overrides,
});

const mockSearchLogic = overrides => {
	const state = buildSearchLogicState(overrides);
	useSearchTableLogic.mockReturnValue(state);
	return state;
};

const mockFetchMesasSuccess = (tables = defaultTables, success = true) => {
	mesasModule.fetchMesas.mockResolvedValue({success, data: tables});
};

const mockFetchMesasFailure = error => {
	mesasModule.fetchMesas.mockRejectedValue(error ?? new Error('fetchMesas error'));
};

const mockAxiosTablesResponse = response => {
	axios.get.mockResolvedValue(response);
};

const mockAxiosTablesFailure = error => {
	axios.get.mockRejectedValue(error ?? new Error('axios error'));
};

const flushPromises = () =>
	new Promise(resolve => {
		setImmediate(resolve);
	});

module.exports = {
	axios,
	mesasModule,
	defaultTables,
	buildNavigation,
	buildRoute,
	buildSearchLogicState,
	mockSearchLogic,
	mockFetchMesasSuccess,
	mockFetchMesasFailure,
	mockAxiosTablesResponse,
	mockAxiosTablesFailure,
	flushPromises,
};
