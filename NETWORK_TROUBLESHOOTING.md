# Guía de Solución de Errores de Red

## Error: "AxiosError: Network Error"

### Descripción
Este error ocurre cuando la aplicación React Native no puede establecer conexión con los servidores backend.

### Causas Comunes
1. **URLs incorrectas o inalcanzables**
2. **Configuración de red de Android restrictiva**
3. **Problemas de conectividad del dispositivo**
4. **Timeouts de red**
5. **CORS o políticas de seguridad del servidor**

### Soluciones Implementadas

#### 1. Configuración de Variables de Entorno
Verificar que las URLs en `.env` sean correctas:
```env
BACKEND=https://backssi.tuvotodecide.com/
BACKEND_BLOCKCHAIN=https://backocr.tuvotodecide.com
BACKEND_RESULT=https://dbackresultados.tuvotodecide.com
```

#### 2. Configuración de Network Security (Android)
Se ha actualizado `android/app/src/main/res/xml/network_security_config.xml` para permitir conexiones HTTPS a los dominios del backend.

#### 3. Mejoras en el Cliente HTTP
- Timeouts reducidos de 50s a 30s
- Interceptores de error mejorados
- Logging detallado de errores de red
- Headers de Accept añadidos

#### 4. Utilidades de Red
Se han creado nuevas utilidades en `/src/utils/networkUtils.js`:
- `checkInternetConnection()`: Verifica conectividad a internet
- `validateBackendConnectivity()`: Prueba conexión con endpoints backend
- `showNetworkErrorAlert()`: Muestra alertas de error user-friendly
- `retryWithBackoff()`: Implementa retry con backoff exponencial

#### 5. Hook Personalizado
`/src/hooks/useNetworkRequest.js` proporciona:
- Manejo automático de loading states
- Retry automático con backoff
- Verificación de conectividad
- Alertas de error automáticas

### Cómo Usar las Nuevas Utilidades

```javascript
import { useNetworkRequest } from '../hooks/useNetworkRequest';
import { Http } from '../data/client/http';

const { loading, error, executeRequest } = useNetworkRequest();

// Llamada a API con manejo de errores mejorado
const fetchData = async () => {
  try {
    const result = await executeRequest(
      () => Http.get('users'),
      {
        showAlert: true,     // Mostrar alerta en caso de error
        maxRetries: 3,       // Número máximo de reintentos
        requireInternet: true // Verificar internet antes del request
      }
    );
    console.log('Data fetched:', result);
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

### Debugging de Errores de Red

#### 1. Verificar Logs
Los nuevos interceptores de Axios logean información detallada:
```
Axios Error Details: {
  message: "Network Error",
  code: "NETWORK_ERROR", 
  url: "/users",
  baseURL: "https://backssi.tuvotodecide.com/",
  timeout: 30000
}
```

#### 2. Probar Conectividad
```javascript
import { validateBackendConnectivity } from '../utils/networkUtils';

const testConnection = async () => {
  const results = await validateBackendConnectivity();
  console.log('Connectivity results:', results);
};
```

#### 3. Verificar Variables de Entorno
Asegurarse de que las variables se estén cargando correctamente:
```javascript
import { BACKEND, BACKEND_BLOCKCHAIN } from '@env';
console.log('Backend URLs:', { BACKEND, BACKEND_BLOCKCHAIN });
```

### Pasos de Troubleshooting

1. **Verificar Conectividad a Internet**
   - Probar navegación web en el dispositivo
   - Verificar configuración de proxy/VPN

2. **Probar URLs en el Browser**
   - Abrir las URLs del backend en el navegador
   - Verificar que respondan correctamente

3. **Revisar Logs de la Aplicación**
   - Buscar errores específicos en los logs
   - Verificar si las URLs se están construyendo correctamente

4. **Reiniciar Servicios**
   ```bash
   # Limpiar cache de Metro
   npx react-native start --reset-cache
   
   # Limpiar build de Android
   cd android && ./gradlew clean && cd ..
   
   # Reinstalar la app
   npx react-native run-android
   ```

5. **Verificar Configuración de Red del Dispositivo**
   - Configuración de APN
   - Restricciones de firewall corporativo
   - Configuración de DNS

### Archivos Modificados
- `/src/data/client/http.js` - Cliente HTTP mejorado
- `/src/api/account.js` - Corregida URL hardcodeada
- `/android/app/src/main/res/xml/network_security_config.xml` - Configuración de red
- `.env` - Variables de entorno corregidas
- `/src/utils/networkUtils.js` - Nuevas utilidades de red
- `/src/hooks/useNetworkRequest.js` - Hook para requests

### Próximos Pasos
Si los errores persisten después de implementar estas soluciones:
1. Verificar configuración del servidor backend
2. Revisar políticas CORS del servidor
3. Considerar implementar un proxy para desarrollo
4. Contactar al equipo de backend para diagnóstico del servidor
