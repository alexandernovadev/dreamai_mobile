import Constants from 'expo-constants';
import {
  APP_BUILD_ISO_DATE,
  APP_ENV_LABEL,
  APP_GIT_COMMIT,
  APP_PACKAGE_VERSION,
} from './buildInfo.generated';

export type ClientBuildInfo = {
  serviceName: string;
  version: string;
  buildAt: string;
  environment: string;
  commit: string;
};

/**
 * Metadatos del cliente embebidos en el bundle (generados por `scripts/generate-build-info.mjs`).
 * `version` prioriza `app.json` / Expo si existe.
 */
export function getClientBuildInfo(): ClientBuildInfo {
  const version =
    Constants.expoConfig?.version ?? APP_PACKAGE_VERSION;
  return {
    serviceName: 'dreamai_app',
    version,
    buildAt: APP_BUILD_ISO_DATE,
    environment: APP_ENV_LABEL,
    commit: APP_GIT_COMMIT || '',
  };
}
