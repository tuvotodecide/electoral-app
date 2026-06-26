import {File, Paths, __fileInstances} from 'expo-file-system';
import {persistLocalImage, removePersistedImage} from '../../../src/utils/persistLocalImage';

jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
}));

const mockFetch = jest.fn();
const originalFetch = global.fetch;

describe('persistLocalImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __fileInstances.length = 0;
    jest.spyOn(Date, 'now').mockReturnValue(123);
    global.fetch = mockFetch;
  });

  afterEach(() => {
    Date.now.mockRestore();
    global.fetch = originalFetch;
  });

  it('descarga y persiste si es URL http', async () => {
    mockFetch.mockResolvedValueOnce({
      headers: {
        get: jest.fn(() => 'image/png'),
      },
    });

    const out = await persistLocalImage('https://example.com/image.png');
    expect(out).toBe(`${Paths.document.uri}/acta-123.png`);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.png', {method: 'HEAD'});
    expect(File.downloadFileAsync).toHaveBeenCalledWith(
      'https://example.com/image.png',
      `${Paths.document.uri}/acta-123.png`,
    );
  });

  it('lanza error si la descarga HTTP no genera archivo', async () => {
    mockFetch.mockResolvedValueOnce({
      headers: {
        get: jest.fn(() => 'image/png'),
      },
    });
    File.downloadFileAsync.mockResolvedValueOnce({
      exists: false,
    });

    await expect(persistLocalImage('https://example.com/image.png')).rejects.toThrow(
      'Descarga HTTP sin archivo generado',
    );
  });

  it('copia archivos file:// directamente', async () => {
    const out = await persistLocalImage('file:///src/photo.jpg');
    expect(out).toBe(`${Paths.document.uri}/acta-123.jpg`);
    expect(__fileInstances).toHaveLength(2);
    expect(__fileInstances[0].uri).toBe('file:///src/photo.jpg');
    expect(__fileInstances[1].uri).toBe(`${Paths.document.uri}/acta-123.jpg`);
    expect(__fileInstances[0].copy).toHaveBeenCalledWith(__fileInstances[1]);
  });

  it('lee contenido content:// en android', async () => {
    const out = await persistLocalImage('content://media/1');
    expect(out).toBe(`${Paths.document.uri}/acta-123.jpg`);
    expect(__fileInstances).toHaveLength(2);
    expect(__fileInstances[0].uri).toBe('content://media/1');
    expect(__fileInstances[1].uri).toBe(`${Paths.document.uri}/acta-123.jpg`);
    expect(__fileInstances[0].base64).toHaveBeenCalled();
    expect(__fileInstances[1].write).toHaveBeenCalledWith('ZGF0YQ==', {
      encoding: 'base64',
    });
  });

  it('removePersistedImage elimina si existe', async () => {
    await removePersistedImage('file:///mock/documents/acta-1.jpg');
    expect(__fileInstances).toHaveLength(1);
    expect(__fileInstances[0].uri).toBe('file:///mock/documents/acta-1.jpg');
    expect(__fileInstances[0].info).toHaveBeenCalled();
    expect(__fileInstances[0].delete).toHaveBeenCalled();
  });

  it('removePersistedImage ignora entradas invalidas', async () => {
    await removePersistedImage(null);
    await removePersistedImage(123);
  });
});
