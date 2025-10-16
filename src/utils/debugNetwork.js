import { BACKEND, BACKEND_BLOCKCHAIN, BACKEND_RESULT } from '@env';

/**
 * Función de debug para verificar la configuración de URLs
 */
export const debugEnvironmentConfig = () => {
  //console.log('=== ENVIRONMENT CONFIGURATION DEBUG ===');
  //console.BACKEND_BLOCKCHAIN:', BACKEND_BLOCKCHAIN);
  //console.log('BACKEND_RESULT:', BACKEND_RESULT);log('BACKEND:', BACKEND);
  //console.log('
  
  // Verificar si hay caracteres extraños
  const backendChars = BACKEND ? Array.from(BACKEND).map(char => char.charCodeAt(0)) : [];
  const blockchainChars = BACKEND_BLOCKCHAIN ? Array.from(BACKEND_BLOCKCHAIN).map(char => char.charCodeAt(0)) : [];
  
  //console.log('BACKEND char codes:', backendChars);
  //console.log('BACKEND_BLOCKCHAIN char codes:', blockchainChars);
  
  // Verificar longitud
  //console.log('BACKEND length:', BACKEND?.length);
  //console.log('BACKEND_BLOCKCHAIN length:', BACKEND_BLOCKCHAIN?.length);
  
  // Verificar si hay comillas o espacios
  //console.log('BACKEND has quotes:', BACKEND?.includes("'") || BACKEND?.includes('"'));
  //console.log('BACKEND_BLOCKCHAIN has quotes:', BACKEND_BLOCKCHAIN?.includes("'") || BACKEND_BLOCKCHAIN?.includes('"'));
  
  // Verificar URLs válidas
  try {
    if (BACKEND) new URL(BACKEND);
    //console.log('BACKEND: Valid URL ✓');
  } catch (e) {
    //console.error('BACKEND: Invalid URL ✗', e.message);
  }
  
  try {
    if (BACKEND_BLOCKCHAIN) new URL(BACKEND_BLOCKCHAIN);
    //console.log('BACKEND_BLOCKCHAIN: Valid URL ✓');
  } catch (e) {
    //console.error('BACKEND_BLOCKCHAIN: Invalid URL ✗', e.message);
  }
  
  //console.log('=== END DEBUG ===');
};

/**
 * Prueba de conectividad simple con fetch
 */
export const testUrlConnectivity = async (url, name = 'Test URL') => {
  //console.log(`Testing ${name}: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    //console.log(`${name} - Status: ${response.status}, OK: ${response.ok}`);
    return { ok: response.ok, status: response.status };
    
  } catch (error) {
    //console.error(`${name} - Error:`, error.message);
    return { ok: false, error: error.message };
  }
};

/**
 * Función para probar todas las URLs del ambiente
 */
export const testAllEnvironmentUrls = async () => {
  //console.log('=== TESTING ALL ENVIRONMENT URLS ===');
  
  const urls = [
    { name: 'BACKEND', url: BACKEND },
    { name: 'BACKEND_BLOCKCHAIN', url: BACKEND_BLOCKCHAIN },
    { name: 'BACKEND_RESULT', url: BACKEND_RESULT },
  ];
  
  const results = [];
  
  for (const { name, url } of urls) {
    if (url) {
      const result = await testUrlConnectivity(url, name);
      results.push({ name, url, ...result });
    } else {
      //console.log(`${name}: Not configured`);
      results.push({ name, url: null, ok: false, error: 'Not configured' });
    }
  }
  
  //console.log('=== TEST RESULTS ===');
  results.forEach(result => {
    //console.log(`${result.name}: ${result.ok ? 'OK' : 'FAILED'} - ${result.url}`);
    if (!result.ok && result.error) {
      //console.log(`  Error: ${result.error}`);
    }
  });
  
  return results;
};
