/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'live' talks to the FastAPI backend, 'demo' keeps sample data in the browser. */
  readonly VITE_API_MODE?: 'live' | 'demo';
  /** Base URL of the API. Defaults to /api (same origin, or the Vite dev proxy). */
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
