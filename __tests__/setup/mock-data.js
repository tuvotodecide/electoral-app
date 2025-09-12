/**
 * Mock Data
 * Datos de prueba reutilizables
 */

// Mock Users
export const mockUsers = {
  authenticated: {
    id: 'user-auth-123',
    email: 'authenticated@example.com',
    phone: '+1234567890',
    name: 'Authenticated User',
    isVerified: true,
    pin: '1234',
    biometricEnabled: true,
  },
  
  unverified: {
    id: 'user-unverified-456',
    email: 'unverified@example.com',
    phone: '+0987654321',
    name: 'Unverified User',
    isVerified: false,
    pin: null,
    biometricEnabled: false,
  },
  
  guardian: {
    id: 'user-guardian-789',
    email: 'guardian@example.com',
    phone: '+1122334455',
    name: 'Guardian User',
    isVerified: true,
    pin: '5678',
    biometricEnabled: false,
  },
};

// Mock Voting Tables
export const mockVotingTables = [
  {
    id: 'table-001',
    number: '001',
    location: 'Escuela Primaria Central',
    address: 'Av. Principal 123',
    district: 'Centro',
    voters: 150,
    status: 'active',
  },
  {
    id: 'table-002',
    number: '002',
    location: 'Instituto Tecnológico',
    address: 'Calle Secundaria 456',
    district: 'Norte',
    voters: 200,
    status: 'active',
  },
  {
    id: 'table-003',
    number: '003',
    location: 'Centro Comunitario Sur',
    address: 'Av. Sur 789',
    district: 'Sur',
    voters: 120,
    status: 'inactive',
  },
];

// Mock Guardians
export const mockGuardians = [
  {
    id: 'guardian-001',
    name: 'Ana García',
    email: 'ana.garcia@example.com',
    phone: '+1234567890',
    status: 'active',
    relationship: 'friend',
  },
  {
    id: 'guardian-002',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@example.com',
    phone: '+1234567891',
    status: 'pending',
    relationship: 'family',
  },
  {
    id: 'guardian-003',
    name: 'María Rodriguez',
    email: 'maria.rodriguez@example.com',
    phone: '+1234567892',
    status: 'active',
    relationship: 'colleague',
  },
];

// Mock Electoral Records
export const mockElectoralRecords = [
  {
    id: 'record-001',
    tableId: 'table-001',
    timestamp: '2025-09-10T10:00:00Z',
    photos: ['photo1.jpg', 'photo2.jpg'],
    witnesses: ['witness-001', 'witness-002'],
    status: 'completed',
    votes: {
      candidate1: 45,
      candidate2: 38,
      candidate3: 22,
      blank: 3,
      null: 1,
    },
  },
  {
    id: 'record-002',
    tableId: 'table-002',
    timestamp: '2025-09-10T11:30:00Z',
    photos: ['photo3.jpg'],
    witnesses: ['witness-003'],
    status: 'pending',
    votes: null,
  },
];

// Mock Notifications
export const mockNotifications = [
  {
    id: 'notif-001',
    title: 'Verificación Completada',
    body: 'Tu acta electoral ha sido verificada exitosamente',
    timestamp: '2025-09-10T09:00:00Z',
    type: 'success',
    read: false,
  },
  {
    id: 'notif-002',
    title: 'Nuevo Testigo Agregado',
    body: 'María Rodriguez ha sido agregada como testigo',
    timestamp: '2025-09-10T08:30:00Z',
    type: 'info',
    read: true,
  },
  {
    id: 'notif-003',
    title: 'Actualización de Sistema',
    body: 'Nueva versión disponible con mejoras de seguridad',
    timestamp: '2025-09-09T20:00:00Z',
    type: 'warning',
    read: false,
  },
];

// Mock API Responses
export const mockApiResponses = {
  login: {
    success: {
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: mockUsers.authenticated,
      },
      message: 'Login successful',
    },
    
    error: {
      success: false,
      data: null,
      message: 'Invalid credentials',
      error: 'INVALID_CREDENTIALS',
    },
  },
  
  votingTables: {
    success: {
      success: true,
      data: mockVotingTables,
      message: 'Tables retrieved successfully',
    },
    
    error: {
      success: false,
      data: null,
      message: 'Failed to fetch tables',
      error: 'NETWORK_ERROR',
    },
  },
  
  uploadRecord: {
    success: {
      success: true,
      data: {
        recordId: 'record-new-123',
        uploadedAt: '2025-09-10T12:00:00Z',
      },
      message: 'Record uploaded successfully',
    },
    
    error: {
      success: false,
      data: null,
      message: 'Upload failed',
      error: 'UPLOAD_ERROR',
    },
  },
};

// Mock Firebase Data
export const mockFirebaseData = {
  user: {
    uid: 'firebase-uid-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: '+1234567890',
  },
  
  authState: {
    authenticated: true,
    user: 'firebase-uid-123',
  },
  
  messaging: {
    token: 'fcm-token-mock-123456789',
    permission: 'granted',
  },
};

// Mock Redux States
export const mockReduxStates = {
  initial: {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    },
    
    voting: {
      tables: [],
      selectedTable: null,
      currentRecord: null,
      loading: false,
      error: null,
    },
    
    guardians: {
      list: [],
      loading: false,
      error: null,
    },
  },
  
  authenticated: {
    auth: {
      isAuthenticated: true,
      user: mockUsers.authenticated,
      loading: false,
      error: null,
    },
    
    voting: {
      tables: mockVotingTables,
      selectedTable: mockVotingTables[0],
      currentRecord: null,
      loading: false,
      error: null,
    },
    
    guardians: {
      list: mockGuardians,
      loading: false,
      error: null,
    },
  },
  
  loading: {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: true,
      error: null,
    },
    
    voting: {
      tables: [],
      selectedTable: null,
      currentRecord: null,
      loading: true,
      error: null,
    },
  },
  
  error: {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: 'Authentication failed',
    },
    
    voting: {
      tables: [],
      selectedTable: null,
      currentRecord: null,
      loading: false,
      error: 'Failed to load tables',
    },
  },
};

// Mock Form Data
export const mockFormData = {
  login: {
    valid: {
      email: 'test@example.com',
      password: 'password123',
    },
    
    invalid: {
      email: 'invalid-email',
      password: '123',
    },
  },
  
  registration: {
    valid: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      idNumber: '12345678',
      address: '123 Main Street',
    },
    
    invalid: {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      phone: '123',
      dateOfBirth: '',
      idNumber: '',
      address: '',
    },
  },
  
  pin: {
    valid: '1234',
    invalid: '12',
    mismatch: '5678',
  },
};

// Mock Camera Data
export const mockCameraData = {
  photo: {
    uri: 'file:///mock-photo.jpg',
    width: 1080,
    height: 1920,
    type: 'image/jpeg',
  },
  
  permissions: {
    camera: 'granted',
    storage: 'granted',
  },
};

// Mock Location Data
export const mockLocationData = {
  current: {
    latitude: -12.0464,
    longitude: -77.0428,
    address: 'Lima, Peru',
  },
  
  votingLocations: [
    {
      id: 'loc-001',
      name: 'Escuela Central',
      address: 'Av. Central 123',
      latitude: -12.0465,
      longitude: -77.0429,
      distance: 0.1,
    },
    {
      id: 'loc-002',
      name: 'Instituto Norte',
      address: 'Calle Norte 456',
      latitude: -12.0400,
      longitude: -77.0400,
      distance: 0.8,
    },
  ],
};
