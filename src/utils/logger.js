const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let msg = `${timestamp} [${level}] ${message}`;
      if (stack) msg += `\n${stack}`;
      if (Object.keys(meta).length) msg += ` ${JSON.stringify(meta)}`;
      return msg;
    })
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
