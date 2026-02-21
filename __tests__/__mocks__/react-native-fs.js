const mockFs = {
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
