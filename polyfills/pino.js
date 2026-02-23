/**
 * Pino polyfill for React Native
 * Provides a minimal implementation compatible with pino-caller
 */

// Define symbols that pino-caller expects
const asJsonSym = Symbol('pino.asJson');
const writeSym = Symbol('pino.write');
const redactFmtSym = Symbol('pino.redactFmt');
const messageKeySym = Symbol('pino.messageKey');
const nestedKeySym = Symbol('pino.nestedKey');
const wildcardFirstSym = Symbol('pino.wildcardFirst');
const serializersSym = Symbol('pino.serializers');
const formattersSym = Symbol('pino.formatters');
const hooksSym = Symbol('pino.hooks');
const needsMetadataGsym = Symbol('pino.needsMetadata');
const chindings = Symbol('pino.chindings');
const parsedChindings = Symbol('pino.parsedChindings');
const endSym = Symbol('pino.end');
const formatOptsSym = Symbol('pino.formatOpts');
const stringifySym = Symbol('pino.stringify');
const stringifiersSym = Symbol('pino.stringifiers');
const setLevelSym = Symbol('pino.setLevel');
const getLevelSym = Symbol('pino.getLevel');
const levelValSym = Symbol('pino.levelVal');
const useLevelLabelsSym = Symbol('pino.useLevelLabels');
const mixinSym = Symbol('pino.mixin');
const lsCacheSym = Symbol('pino.lsCache');
const chindingsSym = Symbol('pino.chindings');
const streamSym = Symbol('pino.stream');
const timeSym = Symbol('pino.time');

const symbols = {
  asJsonSym,
  writeSym,
  redactFmtSym,
  messageKeySym,
  nestedKeySym,
  wildcardFirstSym,
  serializersSym,
  formattersSym,
  hooksSym,
  needsMetadataGsym,
  chindings,
  parsedChindings,
  endSym,
  formatOptsSym,
  stringifySym,
  stringifiersSym,
  setLevelSym,
  getLevelSym,
  levelValSym,
  useLevelLabelsSym,
  mixinSym,
  lsCacheSym,
  chindingsSym,
  streamSym,
  timeSym,
};

const levels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const levelNames = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

function createLogger(options = {}) {
  const level = options.level || 'info';
  const levelValue = levels[level] || 40;
  const name = options.name || '';

  const formatMessage = (levelName, args) => {
    const timestamp = new Date().toISOString();
    const messages = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, (key, value) => typeof value === 'bigint' ? value.toString() : value) : String(arg)
    ).join(' ');
    return `[${timestamp}] ${levelName.toUpperCase()}${name ? ` (${name})` : ''}: ${messages}`;
  };

  const logger = {
    level,
    [levelValSym]: levelValue,
    [chindingsSym]: '',
    [streamSym]: { write: () => {} },
    
    levels: { values: levels, labels: levelNames },
    
    trace: (...args) => {
      if (levelValue <= levels.trace) {
        console.debug(formatMessage('trace', args));
      }
    },
    
    debug: (...args) => {
      if (levelValue <= levels.debug) {
        console.debug(formatMessage('debug', args));
      }
    },
    
    info: (...args) => {
      if (levelValue <= levels.info) {
        console.info(formatMessage('info', args));
      }
    },
    
    warn: (...args) => {
      if (levelValue <= levels.warn) {
        console.warn(formatMessage('warn', args));
      }
    },
    
    error: (...args) => {
      if (levelValue <= levels.error) {
        console.error(formatMessage('error', args));
      }
    },
    
    fatal: (...args) => {
      if (levelValue <= levels.fatal) {
        console.error(formatMessage('fatal', args));
      }
    },

    child: (bindings = {}) => {
      const childName = bindings.name || name;
      return createLogger({ ...options, name: childName, level });
    },

    // Symbol methods for pino-caller compatibility
    [asJsonSym]: function(obj, msg, num, time) {
      return JSON.stringify({
        level: num,
        time,
        msg,
        ...obj,
      });
    },

    [writeSym]: function(obj, msg, num) {
      const levelName = levelNames[num] || 'info';
      if (num >= levelValue) {
        const logFn = console[levelName] || console.log;
        logFn(formatMessage(levelName, [msg, obj]));
      }
    },

    isLevelEnabled: (checkLevel) => {
      const checkValue = levels[checkLevel] || 30;
      return checkValue >= levelValue;
    },

    bindings: () => ({}),
    flush: () => {},
    
    // For pino-caller: it wraps these methods
    [Symbol.for('pino.serializers')]: {},
  };

  return logger;
}

function pino(options = {}) {
  return createLogger(options);
}

// Attach properties to the pino function
pino.symbols = symbols;
pino.levels = levels;
pino.destination = () => ({ write: () => {} });
pino.transport = () => ({ write: () => {} });
pino.multistream = () => ({ write: () => {} });
pino.stdSerializers = {
  req: (req) => req,
  res: (res) => res,
  err: (err) => ({ message: err.message, stack: err.stack }),
};

module.exports = pino;
module.exports.pino = pino;
module.exports.default = pino;
module.exports.symbols = symbols;
module.exports.levels = levels;
