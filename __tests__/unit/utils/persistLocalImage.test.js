jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  copyFile: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  unlink: jest.fn(() => Promise.resolve()),
}));

const mockBlobFetch = jest.fn();
const mockBlobConfigFetch = jest.fn();
jest.mock('react-native-blob-util', () => ({
  fetch: (...args) => mockBlobFetch(...args),
  config: jest.fn(() => ({
    fetch: (...args) => mockBlobConfigFetch(...args),
  })),
  fs: {
    readFile: jest.fn(() => Promise.resolve('ZGF0YQ==')),
  },
}));

import RNFS from 'react-native-fs';
import BlobUtil from 'react-native-blob-util';
import {persistLocalImage, removePersistedImage} from '../../../src/utils/persistLocalImage';

describe('persistLocalImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(123);
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  it('descarga y persiste si es URL http', async () => {
    mockBlobFetch.mockResolvedValueOnce({
      respInfo: {headers: {'Content-Type': 'image/png'}},
    });
    mockBlobConfigFetch.mockResolvedValueOnce({
      path: () => '/tmp/downloaded.tmp',
    });

    const out = await persistLocalImage('https://example.com/image.png');
    expect(out).toBe('file:///docs/acta-123.png');
    expect(mockBlobFetch).toHaveBeenCalledWith('HEAD', 'https://example.com/image.png');
    expect(BlobUtil.config).toHaveBeenCalled();
    expect(RNFS.copyFile).toHaveBeenCalledWith('/tmp/downloaded.tmp', '/docs/acta-123.png');
    expect(RNFS.unlink).toHaveBeenCalledWith('/tmp/downloaded.tmp');
  });

  it('lanza error si la descarga HTTP no entrega path', async () => {
    mockBlobFetch.mockResolvedValueOnce({
      respInfo: {headers: {'Content-Type': 'image/png'}},
    });
    mockBlobConfigFetch.mockResolvedValueOnce({
      path: () => null,
    });

    await expect(persistLocalImage('https://example.com/image.png')).rejects.toThrow(
      'Descarga HTTP sin path',
    );
  });

  it('copia archivos file:// directamente', async () => {
    const out = await persistLocalImage('file:///src/photo.jpg');
    expect(out).toBe('file:///docs/acta-123.jpg');
    expect(RNFS.copyFile).toHaveBeenCalledWith('/src/photo.jpg', '/docs/acta-123.jpg');
  });

  it('lee contenido content:// en android', async () => {
    const out = await persistLocalImage('content://media/1');
    expect(out).toBe('file:///docs/acta-123.jpg');
    expect(BlobUtil.fs.readFile).toHaveBeenCalledWith('content://media/1', 'base64');
    expect(RNFS.writeFile).toHaveBeenCalledWith('/docs/acta-123.jpg', 'ZGF0YQ==', 'base64');
  });

  it('removePersistedImage elimina si existe', async () => {
    await removePersistedImage('file:///docs/acta-1.jpg');
    expect(RNFS.exists).toHaveBeenCalledWith('/docs/acta-1.jpg');
    expect(RNFS.unlink).toHaveBeenCalledWith('/docs/acta-1.jpg');
  });

  it('removePersistedImage ignora entradas invÃ¡lidas', async () => {
    await removePersistedImage(null);
    await removePersistedImage(123);
  });
});
