/**
 * Recintos electorales sintéticos del modo demostración.
 *
 * Reemplazan la respuesta de
 * `GET /api/v1/geographic/electoral-locations/nearby`, que depende de las
 * coordenadas reales del dispositivo: un revisor de App Store en Cupertino no
 * tiene ningún recinto boliviano cerca y vería una lista vacía.
 *
 * Los nombres de campo replican esa respuesta —incluida la jerarquía
 * `electoralSeat`, que `filterLocations` recorre entera— para que
 * ElectoralLocationsSave no note la diferencia. `tables` viene poblado a
 * propósito: UnifiedTableScreen.js:102-109 usa `locationData.tables` cuando no
 * está vacío y solo sale a la red si lo está.
 */

import {DEMO_ID_PREFIX} from './demoConfig';

/**
 * Coordenadas fijas (plaza Murillo, La Paz). Solo alimentan el aviso
 * "mostrando recintos cercanos"; en demo no se consulta el GPS.
 */
export const DEMO_USER_COORDS = Object.freeze({
  latitude: -16.4955,
  longitude: -68.1336,
});

const buildTables = (locationSlug, codePrefix, count) =>
  Array.from({length: count}, (_, index) => {
    const tableNumber = String(index + 1).padStart(3, '0');

    return Object.freeze({
      _id: `${DEMO_ID_PREFIX}table_${locationSlug}_${tableNumber}`,
      id: `${DEMO_ID_PREFIX}table_${locationSlug}_${tableNumber}`,
      tableNumber,
      tableCode: `${codePrefix}${tableNumber}`,
      code: `${codePrefix}${tableNumber}`,
    });
  });

const buildElectoralSeat = seatName =>
  Object.freeze({
    name: seatName,
    municipality: {
      name: 'Nuestra Señora de La Paz',
      province: {
        name: 'Pedro Domingo Murillo',
        department: {name: 'La Paz'},
      },
    },
  });

const buildLocation = ({
  slug,
  name,
  code,
  address,
  zone,
  district,
  seatName,
  tableCount,
}) => {
  const tables = buildTables(slug, code, tableCount);
  const id = `${DEMO_ID_PREFIX}location_${slug}`;

  return Object.freeze({
    _id: id,
    id,
    name,
    code,
    address,
    zone,
    district,
    electoralSeat: buildElectoralSeat(seatName),
    tableCount: tables.length,
    tables,
  });
};

const DEMO_ELECTORAL_LOCATIONS = Object.freeze([
  buildLocation({
    slug: 'bolivar',
    name: 'Unidad Educativa Simón Bolívar',
    code: 'DEMO-101',
    address: 'Av. Montes N° 1234',
    zone: 'Central',
    district: 'Distrito 1',
    seatName: 'La Paz - Centro',
    tableCount: 6,
  }),
  buildLocation({
    slug: 'ayacucho',
    name: 'Colegio Nacional Ayacucho',
    code: 'DEMO-102',
    address: 'Av. 6 de Agosto N° 2170',
    zone: 'Sopocachi',
    district: 'Distrito 2',
    seatName: 'La Paz - Sopocachi',
    tableCount: 4,
  }),
  buildLocation({
    slug: 'busch',
    name: 'Unidad Educativa Germán Busch',
    code: 'DEMO-103',
    address: 'Calle Pedro Salazar N° 480',
    zone: 'Miraflores',
    district: 'Distrito 3',
    seatName: 'La Paz - Miraflores',
    tableCount: 5,
  }),
  buildLocation({
    slug: 'litoral',
    name: 'Escuela Republica del Litoral',
    code: 'DEMO-104',
    address: 'Av. Busch esq. Villalobos N° 95',
    zone: 'Villa Fátima',
    district: 'Distrito 4',
    seatName: 'La Paz - Villa Fátima',
    tableCount: 3,
  }),
]);

/** Copia mutable: el consumidor la pasa a `setState` y a filtros. */
export const getDemoElectoralLocations = () =>
  DEMO_ELECTORAL_LOCATIONS.map(location => ({...location}));
