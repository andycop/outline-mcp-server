import axios, { AxiosInstance } from 'axios';
import { RequestContext } from '../utils/toolRegistry.js';

// In Cloudflare Workers, environment variables are provided through the env binding
// No need for dotenv or file system operations
const API_URL = 'https://app.getoutline.com/api';

/**
 * Creates an Outline API client with the specified API key
 */
export function createOutlineClient(apiKey?: string): AxiosInstance {
  const key = apiKey || globalThis.OUTLINE_API_KEY;

  if (!key) {
    throw new Error('OUTLINE_API_KEY must be provided either as parameter or environment variable');
  }

  return axios.create({
    baseURL: globalThis.OUTLINE_API_URL || API_URL,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

/**
 * Gets an outline client using context API key first, then environment variable
 */
export function getOutlineClient(): AxiosInstance {
  const context = RequestContext.getInstance();
  const contextApiKey = context.getApiKey();

  if (contextApiKey) {
    return createOutlineClient(contextApiKey);
  }

  return createOutlineClient();
}

/**
 * Gets the default outline client using environment variable
 * Only validates when called, not on import
 */
export function getDefaultOutlineClient(): AxiosInstance {
  return createOutlineClient();
}

/**
 * Default client instance for backward compatibility
 * Note: This will only validate API key when first accessed, not on import
 */
let _defaultClient: AxiosInstance | null = null;
export const outlineClient = new Proxy({} as AxiosInstance, {
  get(target, prop) {
    if (!_defaultClient) {
      _defaultClient = getDefaultOutlineClient();
    }
    const value = _defaultClient[prop as keyof AxiosInstance];
    return typeof value === 'function' ? value.bind(_defaultClient) : value;
  },
});