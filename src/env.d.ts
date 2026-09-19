import '../worker-configuration';

declare global {
  interface ImportMetaEnv {
    readonly ENABLE_INDEXING?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
