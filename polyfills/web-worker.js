// Dummy Web Worker for React Native
module.exports = class WebWorker {
  constructor() {
    throw new Error("Web Workers are not supported in React Native");
  }
};
