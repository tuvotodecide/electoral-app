// Mock data para simular datos de mesas desde un endpoint
// eslint-disable-next-line import/no-unused-modules
export const mockMesasData = [
  // Mesas del Colegio 23 de marzo
  {
    id: 1,
    numero: 'Mesa 1',
    codigo: '1234',
    colegio: 'Colegio 23 de marzo',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio 23 de marzo',
    locationId: '67123abc45def6789',
  },
  {
    id: 2,
    numero: 'Mesa 2',
    codigo: '1235',
    colegio: 'Colegio 23 de marzo',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio 23 de marzo',
    locationId: '67123abc45def6789',
  },
  {
    id: 3,
    numero: 'Mesa 3',
    codigo: '1236',
    colegio: 'Colegio 23 de marzo',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio 23 de marzo',
    locationId: '67123abc45def6789',
  },
  // Mesas del Colegio Gregorio Reynolds
  {
    id: 4,
    numero: 'Mesa 4',
    codigo: '2234',
    colegio: 'Colegio Gregorio Reynolds',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio Gregorio Reynolds',
    locationId: '67123abc45def6790',
  },
  {
    id: 5,
    numero: 'Mesa 5',
    codigo: '2235',
    colegio: 'Colegio Gregorio Reynolds',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio Gregorio Reynolds',
    locationId: '67123abc45def6790',
  },
  // Mesas del Instituto San José
  {
    id: 6,
    numero: 'Mesa 6',
    codigo: '3234',
    colegio: 'Instituto San José',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Instituto San José',
    locationId: '67123abc45def6791',
  },
  {
    id: 7,
    numero: 'Mesa 7',
    codigo: '3235',
    colegio: 'Instituto San José',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Instituto San José',
    locationId: '67123abc45def6791',
  },
  {
    id: 8,
    numero: 'Mesa 8',
    codigo: '3236',
    colegio: 'Instituto San José',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Instituto San José',
    locationId: '67123abc45def6791',
  },
  // Mesas de la Escuela Nacional
  {
    id: 9,
    numero: 'Mesa 9',
    codigo: '4234',
    colegio: 'Escuela Nacional',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Escuela Nacional',
    locationId: '67123abc45def6792',
  },
  {
    id: 10,
    numero: 'Mesa 10',
    codigo: '4235',
    colegio: 'Escuela Nacional',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Escuela Nacional',
    locationId: '67123abc45def6792',
  },
  // Mesas adicionales para IDs genéricos (fallback universal)
  {
    id: 11,
    numero: 'Mesa 11',
    codigo: '5001',
    colegio: 'Colegio Universal',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio Universal',
    locationId: 'fallback-location',
  },
  {
    id: 12,
    numero: 'Mesa 12',
    codigo: '5002',
    colegio: 'Colegio Universal',
    provincia: 'Provincia Murillo - La Paz',
    recinto: 'Colegio Universal',
    locationId: 'fallback-location',
  },
];

// Simular llamada a API para obtener mesas
export const fetchMesas = async (locationId = null) => {
  return new Promise(resolve => {
    
    // Simular delay de red
    setTimeout(() => {
      // Filtrar mesas por locationId si se proporciona
      const filteredMesas = locationId
        ? mockMesasData.filter(mesa => mesa.locationId === locationId)
        : mockMesasData;

      
   
      resolve({
        success: true,
        data: filteredMesas,
        message: `Mesas obtenidas exitosamente${
          locationId ? ' para el recinto seleccionado' : ''
        }`,
      });
    }, 1000); // 1 segundo de delay
  });
};

// Simular llamada a API para obtener mesas cercanas
export const fetchNearbyMesas = async (_latitude, _longitude) => {
  return new Promise(resolve => {

    // Simular delay de red
    setTimeout(() => {
      // Por ahora devolvemos las mismas mesas, pero ordenadas aleatoriamente
      const shuffledMesas = [...mockMesasData].sort(() => Math.random() - 0.5);

      resolve({
        success: true,
        data: shuffledMesas.slice(0, 3), // Solo las 3 más cercanas
        message: 'Mesas cercanas obtenidas exitosamente',
      });
    }, 1500); // 1.5 segundos de delay
  });
};

// Mock data para actas específicas de cada mesa
const mockActasData = {
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
    
    // Simular delay de red
    setTimeout(() => {
      const actaData = mockActasData[mesaId];
      if (actaData) {
        
        resolve({
          success: true,
          data: actaData,
          message: 'Actas obtenidas exitosamente',
        });
      } else {
        
        resolve({
          success: false,
          data: null,
          message: 'No se encontraron actas para esta mesa',
        });
      }
    }, 800); // 0.8 segundos de delay
  });
};

