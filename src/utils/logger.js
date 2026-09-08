/**
 * Logging facade over pino (pretty-printed to stdout, level from config.json).
 * log()/info() = info level — the default used across the server for packet
 * flow; error() surfaces the few exceptional paths (auth/gadget/parse misses).
 */

const pino = require('pino');
const { logLevel } = require('../../config/default');

const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'dd/mm/yyyy HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: true,
    },
  },
});

function log(...args) {
  logger.info(args.map(String).join(' '));
}

function info(...args) {
  logger.info(args.map(String).join(' '));
}

function error(...args) {
  logger.error(args.map(String).join(' '));
}

module.exports = { logger, log, info, error };
