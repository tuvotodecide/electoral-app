export const jsonSafe = (obj) =>
  JSON.stringify(obj, (_k, v) =>
    typeof v === 'bigint' ? v.toString() : v,
  );
