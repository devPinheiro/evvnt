import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import { createApp } from './App.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[evvnt-backend] listening on :${env.PORT}`);
});

