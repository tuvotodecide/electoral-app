jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
}));

const fileInstances = [];
jest.mock('expo-file-system', () => {
  const base = jest.requireActual('../../__mocks__/expo-file-system');

  class TrackedFile extends base.File {
    constructor(uri) {
      super(uri);
      fileInstances.push(this);
    }
  }

  TrackedFile.downloadFileAsync = base.File.downloadFileAsync;

  return {
    ...base,
    File: TrackedFile,
    __fileInstances: fileInstances,
  };
});

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

import BlobUtil from 'react-native-blob-util';
import {Paths, __fileInstances} from 'expo-file-system';
import {persistLocalImage, removePersistedImage} from '../../../src/utils/persistLocalImage';

describe('persistLocalImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __fileInstances.length = 0;
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
    expect(out).toBe(`file://${Paths.document}/acta-123.png`);
    expect(mockBlobFetch).toHaveBeenCalledWith('HEAD', 'https://example.com/image.png');
    expect(BlobUtil.config).toHaveBeenCalled();
    expect(__fileInstances).toHaveLength(2);
    expect(__fileInstances[0].uri).toBe('/tmp/downloaded.tmp');
    expect(__fileInstances[1].uri).toBe(`${Paths.document}/acta-123.png`);
    expect(__fileInstances[0].copy).toHaveBeenCalledWith(__fileInstances[1]);
    expect(__fileInstances[0].delete).toHaveBeenCalled();
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
    expect(out).toBe(`file://${Paths.document}/acta-123.jpg`);
    expect(__fileInstances).toHaveLength(2);
    expect(__fileInstances[0].uri).toBe('/src/photo.jpg');
    expect(__fileInstances[1].uri).toBe(`${Paths.document}/acta-123.jpg`);
    expect(__fileInstances[0].copy).toHaveBeenCalledWith(__fileInstances[1]);
  });

  it('lee contenido content:// en android', async () => {
    const out = await persistLocalImage('content://media/1');
    expect(out).toBe(`file://${Paths.document}/acta-123.jpg`);
    expect(BlobUtil.fs.readFile).toHaveBeenCalledWith('content://media/1', 'base64');
    expect(__fileInstances).toHaveLength(1);
    expect(__fileInstances[0].uri).toBe(`${Paths.document}/acta-123.jpg`);
    expect(__fileInstances[0].write).toHaveBeenCalledWith('ZGF0YQ==', {
      encoding: 'base64',
    });
  });

  it('removePersistedImage elimina si existe', async () => {
    await removePersistedImage('file:///mock/documents/acta-1.jpg');
    expect(__fileInstances).toHaveLength(1);
    expect(__fileInstances[0].uri).toBe('/mock/documents/acta-1.jpg');
    expect(__fileInstances[0].info).toHaveBeenCalled();
    expect(__fileInstances[0].delete).toHaveBeenCalled();
  });

  it('removePersistedImage ignora entradas invÃ¡lidas', async () => {
    await removePersistedImage(null);
    await removePersistedImage(123);
  });
});
