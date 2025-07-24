const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Referencia a Realtime Database
const database = admin.database();
}

const db = admin.firestore();

// Función para calcular distancia usando fórmula de Haversine
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
    console.log('Iniciando anuncio de conteo con datos:', data);
    
    const { 
      emisorId, 
      ubicacionEmisor, 
      mesaData, 
      radio = 300 
    } = data;

    if (!emisorId || !ubicacionEmisor || !mesaData) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Faltan datos requeridos'
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

      console.log(`Distancia a usuario ${usuarioId}: ${distancia} metros`);

      // Si esta dentro del radio se agrega a la lista de usuarios cercanos
      if (distancia <= radio) {
        usuariosCercanos.push({
          id: usuarioId,
          distancia: Math.round(distancia),
          token: usuario.fcmToken
        });
        tokensNotificacion.push(usuario.fcmToken);
      }
    });

    console.log(`Encontrados ${usuariosCercanos.length} usuarios cercanos`);

    if (tokensNotificacion.length === 0) {
      return {
        success: true,
        message: 'No hay usuarios cercanos para notificar',
        usuariosNotificados: 0
      };
    }

    // Estructura del mensaje
    const mensaje = {
      notification: {
        title: 'Conteo de Votos Iniciado',
        body: `Mesa ${mesaData.numero} - ${mesaData.recinto}`,
      },
      data: {
        tipo: 'conteo_votos',
        mesa: mesaData.numero.toString(),
        mesaNumero: mesaData.numero.toString(),
        mesaCodigo: mesaData.codigo.toString(),
        recinto: mesaData.recinto,
        colegio: mesaData.colegio || mesaData.recinto,
        direccion: `Provincia ${mesaData.provincia}${mesaData.zona ? ' - ' + mesaData.zona : ''}`,
        provincia: mesaData.provincia,
        zona: mesaData.zona || '',
        distrito: mesaData.distrito || '',
        latitude: emisorLat.toString(),
        longitude: emisorLng.toString(),
        timestamp: new Date().toISOString()
      }
    };

    // Envio de notificacion a los tokens listados
    const resultados = await admin.messaging().sendMulticast({
      tokens: tokensNotificacion,
      notification: mensaje.notification,
      data: mensaje.data,
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#4F9858',
          sound: 'default'
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

    // Guardar registro del anuncio en Firestore
    await db.collection('anuncios_conteo').add({
      emisorId,
      ubicacionEmisor: new admin.firestore.GeoPoint(emisorLat, emisorLng),
      mesaData,
      usuariosNotificados: usuariosCercanos.length,
      usuariosCercanos,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      resultadosEnvio: {
        exitosos: resultados.successCount,
        fallidos: resultados.failureCount
      }
    });

    console.log(`Notificaciones enviadas: ${resultados.successCount} exitosas, ${resultados.failureCount} fallidas`);

    return {
      success: true,
      message: `Notificación enviada a ${resultados.successCount} usuarios cercanos`,
      usuariosNotificados: resultados.successCount,
      usuariosCercanos: usuariosCercanos.map(u => ({
        distancia: u.distancia
      }))
    };

  } catch (error) {
    console.error('Error en announceCountToNearby:', error);
    throw new functions.https.HttpsError(
      'internal', 
      'Error procesando el anuncio de conteo',
      error.message
    );
  }
});
