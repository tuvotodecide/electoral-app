class MockFile {
  constructor(uri) {
    this.uri = String(uri || '');
  }

  info = jest.fn(() => ({
    exists: true,
    isDirectory: false,
    size: 0,
    uri: this.uri,
  }));

  copy = jest.fn(() => undefined);

  delete = jest.fn(() => undefined);

  write = jest.fn(() => undefined);

  base64 = jest.fn(() => Promise.resolve(''));
}

MockFile.downloadFileAsync = jest.fn((from, to) =>
  Promise.resolve({
    exists: true,
    uri: String(to || ''),
    statusCode: 200,
    headers: {},
    from,
  }),
);

const Paths = {
  document: { uri: 'file:///mock/documents'},
  cache: { uri: 'file:///mock/cache'},
  temp: { uri: 'file:///mock/tmp'},
};

const mockFs = {
  // expo-file-system API
  File: MockFile,
  Paths,
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(uri =>
    Promise.resolve({
      exists: true,
      isDirectory: false,
      size: 0,
      uri,
    }),
  ),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  copyAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),

  // Legacy react-native-fs compatibility
  readFile: jest.fn(() => Promise.resolve('')),
  writeFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  stat: jest.fn(() =>
    Promise.resolve({
      isFile: () => true,
      isDirectory: () => false,
      size: 0,
    }),
  ),
  readDir: jest.fn(() => Promise.resolve([])),
  copyFile: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  DocumentDirectoryPath: '/mock/documents',
  TemporaryDirectoryPath: '/mock/tmp',
  CachesDirectoryPath: '/mock/cache',
};

module.exports = mockFs;
module.exports.default = mockFs;
module.exports.File = MockFile;
module.exports.Paths = Paths;
