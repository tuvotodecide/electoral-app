export function trucateAddress(address, limit = 3) {
  return address.slice(0, 2+limit) + '...' + address.slice(limit * -1);
}

export function truncateDid(did) {
  return did?.slice(0, 4) + '...' + did.slice(-7);
}