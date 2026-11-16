// Loads variables from a local .env file (if there is one) into process.env.
// On the hosting platform there is no .env file: the variables are set in the
// host's dashboard instead, so a missing file is not an error.
let loaded = false;

export function loadEnv() {
  if (loaded) return;
  loaded = true;
  try {
    process.loadEnvFile();
  } catch {
    // no .env file - fine in production
  }
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
