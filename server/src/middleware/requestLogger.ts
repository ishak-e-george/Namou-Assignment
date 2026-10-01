import pinoHttp from 'pino-http';

export const requestLogger = pinoHttp({
  redact: {
    paths: ['req.headers.cookie', 'res.headers.set-cookie'],
    censor: '[REDACTED]',
  },
});
