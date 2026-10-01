import pinoHttp from 'pino-http';

const createPinoHttp = pinoHttp.default;

export const requestLogger = createPinoHttp({
  redact: {
    paths: ['req.headers.cookie', 'res.headers.set-cookie'],
    censor: '[REDACTED]',
  },
});
