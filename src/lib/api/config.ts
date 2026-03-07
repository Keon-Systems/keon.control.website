/**
 * API Configuration
 * Centralized configuration for KEON Control API
 */

export interface ApiConfig {
  /**
   * Base URL for the API (e.g., "http://localhost:5000")
   */
  baseUrl: string;

  /**
   * Default request timeout in milliseconds
   */
  timeout: number;

  /**
   * Whether to use mock data as fallback when API is unavailable
   */
  useMockFallback: boolean;

  /**
   * Whether API is in "live mode" (actual backend) vs "mock mode"
   */
  liveMode: boolean;
}

/**
 * Get API configuration from environment variables
 */
export function getApiConfig(): ApiConfig {
  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/+$/, "");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || (appOrigin ? `${appOrigin}/api/control` : 'http://localhost:3000/api/control');
  const timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10);
  const useMockFallback = process.env.NEXT_PUBLIC_API_USE_MOCK_FALLBACK !== 'false';
  const liveMode = process.env.NEXT_PUBLIC_API_LIVE_MODE === 'true';

  return {
    baseUrl,
    timeout,
    useMockFallback,
    liveMode,
  };
}

/**
 * Default API configuration
 */
export const defaultApiConfig: ApiConfig = getApiConfig();
