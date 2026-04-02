export const ORACLE_MODEL_DEFAULT_PATH = "/models/mad-hatter-oracle.glb";
export const ORACLE_POSTER_DEFAULT_PATH = "";

/**
 * Single-source config for the Oracle 3D experience.
 * Keep these constants here so swapping assets never requires JSX edits.
 */
export const ORACLE_MODEL_SRC = ORACLE_MODEL_DEFAULT_PATH;
export const ORACLE_POSTER_SRC = "";

export function resolveOracleModelSrc(): string {
  return ORACLE_MODEL_SRC.trim() || ORACLE_MODEL_DEFAULT_PATH;
}

export function resolveOraclePosterSrc(): string {
  return ORACLE_POSTER_SRC.trim() || ORACLE_POSTER_DEFAULT_PATH;
}
