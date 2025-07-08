// Mock data para simular datos de mesas desde un endpoint
export const mockMesasData = [
  {
    id: 1,
    numero: 'Mesa 1',
    codigo: '1234',
    colegio: 'Colegio 23 de marzo',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio 23 de marzo',
  },
  {
    id: 2,
    numero: 'Mesa 2',
    codigo: '123444',
    colegio: 'Colegio Gregorio Reynolds',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio Gregorio Reynolds',
  },
  {
    id: 3,
    numero: 'Mesa 3',
    codigo: '343433',
    colegio: 'Instituto San José',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Instituto San José',
  },
  {
    id: 4,
    numero: 'Mesa 4',
    codigo: '567890',
    colegio: 'Escuela Nacional',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Escuela Nacional',
  },
  {
    id: 5,
    numero: 'Mesa 5',
    codigo: '098765',
    colegio: 'Colegio Santa María',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio Santa María',
  },
];

// Simular llamada a API para obtener mesas
export const fetchMesas = async () => {
  return new Promise(resolve => {
    console.log('API Mock: Fetching mesas...');
    // Simular delay de red
    setTimeout(() => {
      console.log('API Mock: Mesas fetched successfully');
      resolve({
        success: true,
        data: mockMesasData,
        message: 'Mesas obtenidas exitosamente',
      });
    }, 1000); // 1 segundo de delay
  });
};

// Simular llamada a API para obtener mesas cercanas
export const fetchNearbyMesas = async (latitude, longitude) => {
  return new Promise(resolve => {
    console.log('API Mock: Fetching nearby mesas...', {latitude, longitude});
    // Simular delay de red
    setTimeout(() => {
      // Por ahora devolvemos las mismas mesas, pero ordenadas aleatoriamente
      const shuffledMesas = [...mockMesasData].sort(() => Math.random() - 0.5);
      console.log('API Mock: Nearby mesas fetched successfully');
      resolve({
        success: true,
        data: shuffledMesas.slice(0, 3), // Solo las 3 más cercanas
        message: 'Mesas cercanas obtenidas exitosamente',
      });
    }, 1500); // 1.5 segundos de delay
  });
};

// Simular búsqueda de mesa por código
export const searchMesaByCode = async codigo => {
  return new Promise(resolve => {
    console.log('API Mock: Searching mesa by code:', codigo);
    setTimeout(() => {
      const mesa = mockMesasData.find(m => m.codigo === codigo);
      console.log('API Mock: Search completed, found:', !!mesa);
      resolve({
        success: !!mesa,
        data: mesa || null,
        message: mesa ? 'Mesa encontrada' : 'Mesa no encontrada',
      });
    }, 500);
  });
};

// Mock data para actas específicas de cada mesa
export const mockActasData = {
  1: {
    // Mesa 1
    images: [
      {
        id: '1',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '2',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '3',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
    ],
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '45', diputado: '42'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '12', diputado: '8'},
      {id: 'pdc', partido: 'PDC', presidente: '28', diputado: '31'},
      {id: 'morena', partido: 'Morena', presidente: '3', diputado: '2'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '88', value2: '83'},
      {id: 'blancos', label: 'Blancos', value1: '15', value2: '12'},
      {id: 'nulos', label: 'Nulos', value1: '4', value2: '7'},
    ],
  },
  2: {
    // Mesa 2
    images: [
      {
        id: '1',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '2',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '3',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
    ],
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '67', diputado: '59'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '23', diputado: '18'},
      {id: 'pdc', partido: 'PDC', presidente: '41', diputado: '44'},
      {id: 'morena', partido: 'Morena', presidente: '7', diputado: '5'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '138', value2: '126'},
      {id: 'blancos', label: 'Blancos', value1: '22', value2: '18'},
      {id: 'nulos', label: 'Nulos', value1: '8', value2: '12'},
    ],
  },
  3: {
    // Mesa 3
    images: [
      {
        id: '1',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '2',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '3',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
    ],
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '92', diputado: '88'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '34', diputado: '29'},
      {id: 'pdc', partido: 'PDC', presidente: '56', diputado: '61'},
      {id: 'morena', partido: 'Morena', presidente: '11', diputado: '8'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '193', value2: '186'},
      {id: 'blancos', label: 'Blancos', value1: '28', value2: '24'},
      {id: 'nulos', label: 'Nulos', value1: '12', value2: '15'},
    ],
  },
  4: {
    // Mesa 4
    images: [
      {
        id: '1',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '2',
        uri: 'https://placehold.co/400x300/fff8e1/FFC107?text=Acta+Mesa+4+Opcion+2',
      },
      {
        id: '3',
        uri: 'https://placehold.co/400x300/fce4ec/E91E63?text=Acta+Mesa+4+Opcion+3',
      },
    ],
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '76', diputado: '72'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '19', diputado: '15'},
      {id: 'pdc', partido: 'PDC', presidente: '33', diputado: '38'},
      {id: 'morena', partido: 'Morena', presidente: '6', diputado: '4'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '134', value2: '129'},
      {id: 'blancos', label: 'Blancos', value1: '19', value2: '16'},
      {id: 'nulos', label: 'Nulos', value1: '7', value2: '9'},
    ],
  },
  5: {
    // Mesa 5
    images: [
      {
        id: '1',
        uri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      },
      {
        id: '2',
        uri: 'https://placehold.co/400x300/e8eaf6/3F51B5?text=Acta+Mesa+5+Opcion+2',
      },
      {
        id: '3',
        uri: 'https://placehold.co/400x300/e4f5e4/66BB6A?text=Acta+Mesa+5+Opcion+3',
      },
    ],
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '54', diputado: '51'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '28', diputado: '24'},
      {id: 'pdc', partido: 'PDC', presidente: '39', diputado: '42'},
      {id: 'morena', partido: 'Morena', presidente: '9', diputado: '7'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '130', value2: '124'},
      {id: 'blancos', label: 'Blancos', value1: '25', value2: '21'},
      {id: 'nulos', label: 'Nulos', value1: '10', value2: '13'},
    ],
  },
};

// Simula la llamada a API para obtener actas de una mesa específica
export const fetchActasByMesa = async mesaId => {
  return new Promise(resolve => {
    console.log('API Mock: Fetching actas for mesa:', mesaId);
    // Simular delay de red
    setTimeout(() => {
      const actaData = mockActasData[mesaId];
      if (actaData) {
        console.log('API Mock: Actas fetched successfully for mesa:', mesaId);
        resolve({
          success: true,
          data: actaData,
          message: 'Actas obtenidas exitosamente',
        });
      } else {
        console.log('API Mock: No actas found for mesa:', mesaId);
        resolve({
          success: false,
          data: null,
          message: 'No se encontraron actas para esta mesa',
        });
      }
    }, 800); // 0.8 segundos de delay
  });
};

// Mantener compatibilidad con el código existente
export const getMockMesas = () =>
  mockMesasData.map(mesa => ({
    ...mesa,
    id: mesa.id.toString(),
    direccion: mesa.provincia,
  }));

export const getMockMesasConteo = () =>
  mockMesasData.map(mesa => ({
    ...mesa,
    id: mesa.id.toString(),
    direccion: mesa.provincia,
  }));

// Simular llamada a API para obtener mesas de conteo
export const fetchMesasConteo = async () => {
  return new Promise(resolve => {
    console.log('API Mock: Fetching mesas de conteo...');
    // Simular delay de red
    setTimeout(() => {
      const mesasConteo = getMockMesasConteo();
      console.log(
        'API Mock: Mesas de conteo fetched successfully:',
        mesasConteo.length,
      );
      resolve({
        success: true,
        data: mesasConteo,
        message: 'Mesas de conteo cargadas exitosamente',
      });
    }, 1500); // 1.5 segundos de delay
  });
};

// Simular llamada a API para obtener mesas cercanas de conteo
export const fetchNearbyMesasConteo = async () => {
  return new Promise(resolve => {
    console.log('API Mock: Fetching nearby mesas de conteo...');
    // Simular delay de red
    setTimeout(() => {
      // Filtrar solo las primeras 3 mesas como "cercanas"
      const nearbyMesas = getMockMesasConteo().slice(0, 3);
      console.log(
        'API Mock: Nearby mesas de conteo fetched:',
        nearbyMesas.length,
      );
      resolve({
        success: true,
        data: nearbyMesas,
        message: 'Mesas cercanas de conteo encontradas',
      });
    }, 2000); // 2 segundos de delay
  });
};

// Mock data para atestiguamientos del usuario
export const mockAtestiguamientosData = [
  {
    id: 1,
    mesa: 'Mesa 001',
    fecha: '2024-10-27',
    hora: '18:30',
    escuela: 'Escuela Primaria N° 15',
    estado: 'Completado',
    imagen:
      'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
    recinto: 'Escuela Primaria N° 15',
    provincia: 'Provincia Murillo - La Paz',
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '45', diputado: '42'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '12', diputado: '8'},
      {id: 'pdc', partido: 'PDC', presidente: '28', diputado: '31'},
      {id: 'morena', partido: 'Morena', presidente: '3', diputado: '2'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '88', value2: '83'},
      {id: 'blancos', label: 'Blancos', value1: '15', value2: '12'},
      {id: 'nulos', label: 'Nulos', value1: '4', value2: '7'},
    ],
  },
  {
    id: 2,
    mesa: 'Mesa 002',
    fecha: '2024-10-27',
    hora: '17:45',
    escuela: 'Instituto San José',
    estado: 'Pendiente revisión',
    imagen:
      'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
    recinto: 'Instituto San José',
    provincia: 'Provincia Murillo - La Paz',
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '67', diputado: '59'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '23', diputado: '18'},
      {id: 'pdc', partido: 'PDC', presidente: '41', diputado: '44'},
      {id: 'morena', partido: 'Morena', presidente: '7', diputado: '5'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '138', value2: '126'},
      {id: 'blancos', label: 'Blancos', value1: '22', value2: '18'},
      {id: 'nulos', label: 'Nulos', value1: '8', value2: '12'},
    ],
  },
  {
    id: 3,
    mesa: 'Mesa 003',
    fecha: '2024-10-27',
    hora: '16:20',
    escuela: 'Colegio Nacional',
    estado: 'Completado',
    imagen:
      'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
    recinto: 'Colegio Nacional',
    provincia: 'Provincia Murillo - La Paz',
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '92', diputado: '88'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '34', diputado: '29'},
      {id: 'pdc', partido: 'PDC', presidente: '56', diputado: '61'},
      {id: 'morena', partido: 'Morena', presidente: '11', diputado: '8'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '193', value2: '186'},
      {id: 'blancos', label: 'Blancos', value1: '28', value2: '24'},
      {id: 'nulos', label: 'Nulos', value1: '12', value2: '15'},
    ],
  },
  {
    id: 4,
    mesa: 'Mesa 004',
    fecha: '2024-10-26',
    hora: '19:15',
    escuela: 'Escuela Técnica N° 2',
    estado: 'Completado',
    imagen:
      'https://placehold.co/400x300/fff8e1/FFC107?text=Acta+Mesa+4+Opcion+2',
    recinto: 'Escuela Técnica N° 2',
    provincia: 'Provincia Murillo - La Paz',
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '76', diputado: '72'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '19', diputado: '15'},
      {id: 'pdc', partido: 'PDC', presidente: '33', diputado: '38'},
      {id: 'morena', partido: 'Morena', presidente: '6', diputado: '4'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '134', value2: '129'},
      {id: 'blancos', label: 'Blancos', value1: '19', value2: '16'},
      {id: 'nulos', label: 'Nulos', value1: '7', value2: '9'},
    ],
  },
  {
    id: 5,
    mesa: 'Mesa 005',
    fecha: '2024-10-25',
    hora: '20:30',
    escuela: 'Colegio Santa María',
    estado: 'Pendiente revisión',
    imagen:
      'https://placehold.co/400x300/e8eaf6/3F51B5?text=Acta+Mesa+5+Opcion+2',
    recinto: 'Colegio Santa María',
    provincia: 'Provincia Murillo - La Paz',
    partyResults: [
      {id: 'unidad', partido: 'Unidad', presidente: '54', diputado: '51'},
      {id: 'mas-ipsp', partido: 'MAS-IPSP', presidente: '28', diputado: '24'},
      {id: 'pdc', partido: 'PDC', presidente: '39', diputado: '42'},
      {id: 'morena', partido: 'Morena', presidente: '9', diputado: '7'},
    ],
    voteSummaryResults: [
      {id: 'validos', label: 'Válidos', value1: '130', value2: '124'},
      {id: 'blancos', label: 'Blancos', value1: '25', value2: '21'},
      {id: 'nulos', label: 'Nulos', value1: '10', value2: '13'},
    ],
  },
];

// Simular llamada a API para obtener atestiguamientos del usuario
export const fetchMyWitnesses = async () => {
  return new Promise(resolve => {
    console.log('API Mock: Fetching mis atestiguamientos...');
    // Simular delay de red
    setTimeout(() => {
      console.log(
        'API Mock: Mis atestiguamientos fetched successfully:',
        mockAtestiguamientosData.length,
      );
      resolve({
        success: true,
        data: mockAtestiguamientosData,
        message: 'Atestiguamientos cargados exitosamente',
      });
    }, 1200); // 1.2 segundos de delay
  });
};

// Simular llamada a API para obtener detalle de un atestiguamiento
export const fetchDetalleAtestiguamiento = async id => {
  return new Promise(resolve => {
    console.log('API Mock: Fetching detalle atestiguamiento for ID:', id);
    // Simular delay de red
    setTimeout(() => {
      const atestiguamiento = mockAtestiguamientosData.find(
        item => item.id === id,
      );
      if (atestiguamiento) {
        console.log(
          'API Mock: Detalle atestiguamiento fetched:',
          atestiguamiento,
        );
        resolve({
          success: true,
          data: atestiguamiento,
          message: 'Detalle de atestiguamiento encontrado',
        });
      } else {
        console.log('API Mock: Atestiguamiento not found for ID:', id);
        resolve({
          success: false,
          data: null,
          message: 'Atestiguamiento no encontrado',
        });
      }
    }, 800); // 0.8 segundos de delay
  });
};
