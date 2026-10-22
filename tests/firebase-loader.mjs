// Tests use real Firebase SDKs and local emulators, without importing React Native.
import { access } from 'node:fs/promises';
export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('/config/firebase')) return { url: 'tutorly:test-firebase', shortCircuit: true };
  try { return await nextResolve(specifier, context); }
  catch (error) {
    if (specifier.startsWith('.') && !specifier.match(/\.[cm]?jsx?$/)) {
      const url = new URL(`${specifier}.js`, context.parentURL);
      await access(url);
      return nextResolve(url.href, context);
    }
    throw error;
  }
}
export async function load(url, context, nextLoad) {
  if (url === 'tutorly:test-firebase') return {
    format: 'module', shortCircuit: true,
    source: 'export function requireFirebase() { return globalThis.__tutorlyTestFirebase; }',
  };
  return nextLoad(url, context);
}
