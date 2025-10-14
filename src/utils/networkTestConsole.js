/**
 * Script para testing de conectividad desde la consola del navegador
 * Ejecuta esto en las DevTools cuando tengas un error de red
 */

// Función global para debugging de red
global.testNetworkConnectivity = async () => {
  try {
    //console.log('🔍 Starting network connectivity test...');
    
    // Importar funciones de debug
    const { debugEnvironmentConfig, testAllEnvironmentUrls } = require('./src/utils/debugNetwork');
    const { validateBackendConnectivity } = require('./src/utils/networkUtils');
    
    // 1. Debug de configuración
    //console.log('\n📋 Environment Configuration:');
    debugEnvironmentConfig();
    
    // 2. Test de URLs
    //console.log('\n🌐 Testing Environment URLs:');
    const urlResults = await testAllEnvironmentUrls();
    
    // 3. Test de conectividad backend
    //console.log('\n💾 Testing Backend Health:');
    const backendResults = await validateBackendConnectivity();
    
    // 4. Resumen
    //console.log('\n📊 Summary:');
    //console.log('URL Tests:', urlResults.map(r => `${r.name}: ${r.ok ? '✅' : '❌'}`));
    //console.log('Backend Health:', backendResults.map(r => `${r.name}: ${r.ok ? '✅' : '❌'}`));
    
    return {
      urlTests: urlResults,
      backendHealth: backendResults
    };
    
  } catch (error) {
    //console.error('❌ Network test failed:', error);
    return { error: error.message };
  }
};

// Función para probar una URL específica
global.testSpecificUrl = async (url, name = 'Custom URL') => {
  //console.log(`🔗 Testing ${name}: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    //console.log(`✅ ${name} - Status: ${response.status}, OK: ${response.ok}`);
    return { ok: response.ok, status: response.status, url };
    
  } catch (error) {
    //console.error(`❌ ${name} - Error:`, error.message);
    return { ok: false, error: error.message, url };
  }
};

// Función para simular un request HTTP
global.testHttpRequest = async (endpoint, method = 'GET', data = null) => {
  //console.log(`🔄 Testing HTTP ${method} to: ${endpoint}`);
  
  try {
    const { Http } = require('./src/data/client/http');
    
    let result;
    switch (method.toLowerCase()) {
      case 'get':
        result = await Http.get(endpoint);
        break;
      case 'post':
        result = await Http.post(endpoint, data);
        break;
      case 'put':
        result = await Http.put(endpoint, data);
        break;
      case 'delete':
        result = await Http.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    //console.log(`✅ HTTP ${method} successful:`, result);
    return { success: true, data: result };
    
  } catch (error) {
    //console.error(`❌ HTTP ${method} failed:`, error);
    return { 
      success: false, 
      error: error.message,
      url: error.fullUrl,
      status: error.response?.status,
      code: error.code
    };
  }
};

/* console.log(`
🛠️  Network Debug Tools Loaded!

Available commands:
• testNetworkConnectivity() - Run full connectivity test
• testSpecificUrl(url, name) - Test a specific URL
• testHttpRequest(endpoint, method, data) - Test HTTP requests

Example usage:
  testNetworkConnectivity()
  testSpecificUrl('https://google.com', 'Google')
  testHttpRequest('users', 'GET')
`); */
