
import axios from 'axios';

export function cancelTokenSourceWithTimeout(ms = 60_000) {
  const source = axios.CancelToken.source();
  setTimeout(() => source.cancel(`timeout_${ms}`), ms);
  return source;
}
