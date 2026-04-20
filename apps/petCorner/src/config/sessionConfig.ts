const HOUR_IN_MS = 60 * 60 * 1000;

// Default admin session time for the web app.
export const SESSION_TTL_HOURS = 12;
export const SESSION_TTL_MS = SESSION_TTL_HOURS * HOUR_IN_MS;
export const SESSION_STORAGE_KEY = "petcorner.auth.session.v1";
