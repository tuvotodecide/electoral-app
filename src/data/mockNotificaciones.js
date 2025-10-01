// Mock data para simular notificaciones de conteo de votos
export const mockNotificaciones = [
  {
    id: 1,
    mesa: 'Mesa 2023',
    tipo: 'Conteo de Votos',
    colegio: 'Colegio 23 de Marzo',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '1 hora atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 60 * 60 * 1000, // 1 hora atrás
    distancia: '150m'
  },
  {
    id: 2,
    mesa: 'Mesa 1213',
    tipo: 'Conteo de Votos',
    colegio: 'Colegio 23 de Marzo',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '47 min atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 47 * 60 * 1000, // 47 min atrás
    distancia: '230m'
  },
  {
    id: 3,
    mesa: 'Mesa 1772',
    tipo: 'Conteo de Votos',
    colegio: 'Colegio 23 de Marzo',
    direccion: 'Dirección: Provincia Murillo - La Paz',
    tiempo: '35 min atrás',
    icon: 'megaphone',
    estado: 'iniciado',
    timestamp: Date.now() - 35 * 60 * 1000, // 35 min atrás
    distancia: '80m'
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
