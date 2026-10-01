import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.info(`Shop API listening on port ${env.PORT}`);
});
