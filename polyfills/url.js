/**
 * URL polyfill for React Native
 * Adds Node.js-specific functions like pathToFileURL and fileURLToPath
 * that are not available in browser-based URL polyfills
 */

// Get the base URL module
const urlPolyfill = require('url');

/**
 * Converts a file path to a file:// URL
 * @param {string} filepath - The file path to convert
 * @returns {URL} A URL object with the file:// protocol
 */
function pathToFileURL(filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('The "path" argument must be of type string');
  }
  
  // Handle empty path
  if (!filepath) {
    return new URL('file:///');
  }
  
  // Normalize path separators to forward slashes
  let normalizedPath = filepath.replace(/\\/g, '/');
  
  // Ensure the path starts with a slash for absolute paths
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  
  // Encode special characters but preserve forward slashes
  const encodedPath = normalizedPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  
  return new URL('file://' + encodedPath);
}

/**
 * Converts a file:// URL to a file path
 * @param {string|URL} url - The file URL to convert
 * @returns {string} The file path
 */
function fileURLToPath(url) {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  
  if (url.protocol !== 'file:') {
    throw new TypeError('The URL must be of scheme file');
  }
  
  // Decode the pathname
  return decodeURIComponent(url.pathname);
}

// Export everything from the original module plus our additions
module.exports = {
  ...urlPolyfill,
  pathToFileURL,
  fileURLToPath,
  // Also add as default export for ES module compatibility
  default: {
    ...urlPolyfill,
    pathToFileURL,
    fileURLToPath,
  },
};
