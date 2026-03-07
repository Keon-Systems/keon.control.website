/**
 * API Client
 * Base HTTP client for KEON Control API with error handling and correlation ID support
 */

import { defaultApiConfig, type ApiConfig } from './config';
import {
  ApiError,
  NotFoundError,
  ServerError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
  parseApiError,
} from './errors';

export interface RequestOptions {
  /**
   * HTTP method (default: GET)
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  /**
   * Request body (will be JSON stringified)
   */
  body?: unknown;

  /**
   * Additional headers
   */
  headers?: Record<string, string>;

  /**
   * Query parameters
   */
  params?: Record<string, string | number | boolean | undefined | null>;

  /**
   * Request timeout (overrides default)
   */
  timeout?: number;

  /**
   * Correlation ID for request tracing
   */
  correlationId?: string;

  /**
   * Tenant ID for multi-tenant requests
   */
  tenantId?: string;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  headers: Headers;
}

/**
 * Generate a correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Build URL with query parameters
 */
function buildUrl(baseUrl: string, path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Create fetch with timeout
 */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, options)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Parse response based on content type
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  if (contentType?.includes('text/')) {
    return response.text() as T;
  }

  // For binary data or unknown content types
  return response.blob() as T;
}

/**
 * Handle HTTP errors
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = `Request failed with status ${response.status}`;
  let errorDetails: unknown;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      errorMessage =
        (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message) ||
        errorData.message ||
        errorMessage;
      errorDetails = errorData;
    } else {
      errorMessage = await response.text() || errorMessage;
    }
  } catch {
    // If error response parsing fails, use default message
  }

  switch (response.status) {
    case 400:
      throw new ValidationError(errorMessage, errorDetails);
    case 401:
      throw new UnauthorizedError(errorMessage);
    case 404:
      throw new NotFoundError(errorMessage);
    case 500:
    case 502:
    case 503:
    case 504:
      throw new ServerError(errorMessage, response.status, errorDetails);
    default:
      throw new ApiError(errorMessage, response.status, undefined, errorDetails);
  }
}

/**
 * KEON Control API Client
 */
export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig = defaultApiConfig) {
    this.config = config;
  }

  /**
   * Make an HTTP request to the API
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      params,
      timeout = this.config.timeout,
      correlationId = generateCorrelationId(),
      tenantId,
    } = options;

    const url = buildUrl(this.config.baseUrl, path, params);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-Id': correlationId,
      ...headers,
    };

    if (tenantId) {
      requestHeaders['X-Tenant-Id'] = tenantId;
    }

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await fetchWithTimeout(url, requestInit, timeout);

      if (!response.ok) {
        await handleErrorResponse(response);
      }

      const data = await parseResponse<T>(response);

      return {
        data,
        statusCode: response.status,
        headers: response.headers,
      };
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(path, { ...options, method: 'GET' });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(path, { ...options, method: 'POST', body });
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(path, { ...options, method: 'PUT', body });
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(path, { ...options, method: 'DELETE' });
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    const response = await this.request<T>(path, { ...options, method: 'PATCH', body });
    return response.data;
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();
