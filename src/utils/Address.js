export function trucateAddress(address, limit = 3) {
  return address.slice(0, 2+limit) + '...' + address.slice(limit * -1);
}