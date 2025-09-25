/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// Inicializar Firebase Admin
admin.initializeApp();

// Referencia a Realtime Database
const database = admin.database();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Función para calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en metros
}

// Cloud Function para anunciar conteo a usuarios cercanos
exports.announceCountToNearby = functions.https.onCall(async (data, context) => {
  try {
    
    
    const { 
      emisorId, 
      ubicacionEmisor, 
      mesaData, 
      radio = 300 
    } = data;

    // Validar datos requeridos
    if (!emisorId || !ubicacionEmisor || !mesaData) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Faltan datos requeridos: emisorId, ubicacionEmisor, mesaData'
      );
    }

    const { latitude: emisorLat, longitude: emisorLng } = ubicacionEmisor;

    

    // Obtener todos los usuarios activos de Realtime Database
    const usuariosSnapshot = await database.ref('usuarios').once('value');
    const usuarios = usuariosSnapshot.val() || {};

    

    const usuariosCercanos = [];
    const tokensNotificacion = [];

    Object.entries(usuarios).forEach(([usuarioId, usuario]) => {
      // No enviar notificación al usuario que está anunciando
      if (usuarioId === emisorId) {
        
        return;
      }

      // Verificar que el usuario tenga ubicación y token FCM
      if (!usuario.ubicacion || !usuario.fcmToken || !usuario.activo) {
        
        return;
      }

      const usuarioLat = usuario.ubicacion.latitude;
      const usuarioLng = usuario.ubicacion.longitude;

      // Calcular distancia
      const distancia = calculateDistance(
        emisorLat, 
        emisorLng, 
        usuarioLat, 
        usuarioLng
      );

      

      // Si está dentro del radio, agregarlo a la lista
      if (distancia <= radio) {
        usuariosCercanos.push({
          id: usuarioId,
          distancia: Math.round(distancia),
          token: usuario.fcmToken
        });
        tokensNotificacion.push(usuario.fcmToken);
        
      }
    });

    

    if (tokensNotificacion.length === 0) {
      return {
        success: true,
        message: 'No hay usuarios cercanos para notificar',
        usuariosNotificados: 0,
        usuariosCercanos: 0
      };
    }

    // Preparar el mensaje de notificación
    const mensaje = {
      notification: {
        title: '🗳️ Conteo de Votos Iniciado',
        body: `Mesa ${mesaData.numero} - ${mesaData.recinto}`,
      },
      data: {
        tipo: 'conteo_votos',
        mesa: mesaData.numero.toString(),
        mesaNumero: mesaData.numero.toString(),
        mesaCodigo: mesaData.codigo ? mesaData.codigo.toString() : '',
        recinto: mesaData.recinto,
        colegio: mesaData.colegio || mesaData.recinto,
        direccion: `Provincia ${mesaData.provincia}${mesaData.zona ? ' - ' + mesaData.zona : ''}`,
        provincia: mesaData.provincia || '',
        zona: mesaData.zona || '',
        distrito: mesaData.distrito || '',
        latitude: emisorLat.toString(),
        longitude: emisorLng.toString(),
        timestamp: new Date().toISOString(),
        distancia: usuariosCercanos.length > 0 ? usuariosCercanos[0].distancia.toString() + 'm' : 'Cerca'
      }
    };

    

    // Enviar notificaciones a todos los tokens
    const resultados = await admin.messaging().sendMulticast({
      tokens: tokensNotificacion,
      notification: mensaje.notification,
      data: mensaje.data,
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#2790b0',
          sound: 'default',
          channelId: 'conteo_votos'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });

    
    
    

    // Log de errores si los hay
    if (resultados.failureCount > 0) {
      resultados.responses.forEach((resp, idx) => {
        if (!resp.success) {
        }
      });
    }

    return {
      success: true,
      message: `Notificaciones enviadas a ${resultados.successCount} usuarios`,
      usuariosNotificados: resultados.successCount,
      usuariosCercanos: usuariosCercanos.length,
      errores: resultados.failureCount,
      detalleUsuarios: usuariosCercanos.map(u => ({
        id: u.id.substring(0, 8) + '...',
        distancia: u.distancia
      }))
    };

  } catch (error) {
    throw new functions.https.HttpsError(
      'internal', 
      `Error interno del servidor: ${error.message}`
    );
  }
});

// Función de prueba para verificar que las funciones están funcionando
exports.testFunction = functions.https.onRequest((request, response) => {
  logger.info("🧪 Función de prueba ejecutada", {structuredData: true});
  response.json({
    message: "Firebase Functions funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Función para obtener estadísticas de usuarios
exports.getUserStats = functions.https.onCall(async (data, context) => {
  try {
    const usuariosSnapshot = await database.ref('usuarios').once('value');
    const usuarios = usuariosSnapshot.val() || {};
    
    const stats = {
      totalUsuarios: Object.keys(usuarios).length,
      usuariosActivos: Object.values(usuarios).filter(u => u.activo).length,
      usuariosConUbicacion: Object.values(usuarios).filter(u => u.ubicacion).length,
      usuariosConToken: Object.values(usuarios).filter(u => u.fcmToken).length,
      timestamp: new Date().toISOString()
    };
    
    
    return stats;
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error obteniendo estadísticas');
  }
});
