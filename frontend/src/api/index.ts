import { IS_DEMO } from '../config';
import { demoApi } from './demo';
import { httpApi } from './http';
import type { Api } from './types';

/** The active backend: FastAPI in production, the in-browser sample store in demo builds. */
export const api: Api = IS_DEMO ? demoApi : httpApi;
export * from './types';
