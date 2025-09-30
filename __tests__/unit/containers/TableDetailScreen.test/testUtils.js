const React = require('react');
const {render, act} = require('@testing-library/react-native');
const TableDetailModule = require('../../../../src/container/Vote/UploadRecord/TableDetail');
const TableDetail = TableDetailModule.default ?? TableDetailModule;

if (typeof TableDetail !== 'function') {
  throw new Error(
    `TableDetail component is not a function. Module keys: ${Object.keys(TableDetailModule)}`,
  );
}
const {StackNav} = require('../../../../src/navigation/NavigationKey');

const defaultMesa = {
  locationId: 'loc-001',
  tableNumber: '100',
  codigo: 'C-100',
  colegio: 'Colegio Central',
  provincia: 'Provincia Norte',
  recinto: 'Recinto Central',
  address: 'Av. Principal 123',
};

const buildNavigation = overrides => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  ...overrides,
});

const buildMesa = overrides => ({
  ...defaultMesa,
  ...overrides,
});

const buildRoute = overrides => {
  const mesaOverrides = overrides?.mesa ?? overrides?.tableData;
  const mesa = buildMesa(mesaOverrides ?? {});

  return {
    params: {
      mesa,
      tableData: overrides?.tableData ? buildMesa(overrides.tableData) : mesa,
      existingRecords: overrides?.existingRecords ?? [],
      totalRecords:
        overrides?.totalRecords ?? overrides?.existingRecords?.length ?? 0,
      mesaInfo: overrides?.mesaInfo ?? null,
      capturedImage: overrides?.capturedImage ?? null,
      modalVisible: overrides?.modalVisible,
      ...overrides?.extraParams,
    },
  };
};

const renderTableDetail = ({navigation, route, routeParams} = {}) => {
  const navMock = navigation ?? buildNavigation();
  const routeMock = route ?? buildRoute(routeParams);

  const utils = render(
    React.createElement(TableDetail, {navigation: navMock, route: routeMock}),
  );

  return {
    navigation: navMock,
    route: routeMock,
    ...utils,
  };
};

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

module.exports = {
  StackNav,
  defaultMesa,
  buildMesa,
  buildRoute,
  buildNavigation,
  renderTableDetail,
  flushPromises,
  act,
};
