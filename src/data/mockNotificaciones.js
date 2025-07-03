// Mock data para simular notificaciones de conteo de votos
export const mockNotificaciones = [
  {
    id: 1,
    mesa: 'Mesa 2',
    tipo: 'Conteo de Votos',
    colegio: 'Colegio 23 de Marzo',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '1 hora atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 60 * 60 * 1000, // 1 hora atrás
  },
  {
    id: 2,
    mesa: 'Mesa 4',
    tipo: 'Conteo de Votos',
    colegio: 'Colegio 23 de Marzo',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '47 min atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 47 * 60 * 1000, // 47 min atrás
  },
  {
    id: 3,
    mesa: 'Mesa 1',
    tipo: 'Conteo de Votos',
    colegio: 'Colegio 23 de Marzo',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '35 min atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 35 * 60 * 1000, // 35 min atrás
  },
  {
    id: 4,
    mesa: 'Mesa 3',
    tipo: 'Conteo de Votos',
    colegio: 'Colegio 23 de Marzo',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '30 min atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 30 * 60 * 1000, // 30 min atrás
  },
  {
    id: 5,
    mesa: 'Mesa 5',
    tipo: 'Acta Subida',
    colegio: 'Instituto Nacional de Educación',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '20 min atrás',
    icon: 'camera',
    estado: 'completado',
    timestamp: Date.now() - 20 * 60 * 1000, // 20 min atrás
  },
  {
    id: 6,
    mesa: 'Mesa 7',
    tipo: 'Atestiguamiento Solicitado',
    colegio: 'Escuela Primaria San José',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '15 min atrás',
    icon: 'eye',
    estado: 'pendiente',
    timestamp: Date.now() - 15 * 60 * 1000, // 15 min atrás
  },
  {
    id: 7,
    mesa: 'Mesa 6',
    tipo: 'Conteo de Votos',
    colegio: 'Unidad Educativa Central',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '12 min atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 12 * 60 * 1000, // 12 min atrás
  },
  {
    id: 8,
    mesa: 'Mesa 8',
    tipo: 'Acta Verificada',
    colegio: 'Colegio María Auxiliadora',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '8 min atrás',
    icon: 'checkmark-circle',
    estado: 'completado',
    timestamp: Date.now() - 8 * 60 * 1000, // 8 min atrás
  },
];

// Función para obtener notificaciones (simula API call)
export const getNotificaciones = () => {
  return new Promise(resolve => {
    // Simular delay de API
    setTimeout(() => {
      resolve(mockNotificaciones);
    }, 500);
  });
};

// Función para formatear tiempo relativo
export const formatTiempoRelativo = timestamp => {
  const ahora = Date.now();
  const diferencia = ahora - timestamp;

  const minutos = Math.floor(diferencia / (1000 * 60));
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  if (minutos < 60) {
    return `${minutos} min atrás`;
  } else if (horas < 24) {
    return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
  } else {
    return `${dias} día${dias > 1 ? 's' : ''} atrás`;
  }
};
