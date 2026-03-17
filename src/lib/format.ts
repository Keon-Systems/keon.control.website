/**
 * Data formatting utilities for Keon Command Center.
 * All formatters are designed for high-assurance system display with precision and consistency.
 */

/**
 * Formats a timestamp to ISO 8601 format with milliseconds.
 *
 * @param date - The date to format
 * @returns ISO 8601 string with milliseconds (e.g., "2025-01-04T14:30:45.123Z")
 *
 * @example
 * formatTimestamp(new Date()) // "2025-01-04T14:30:45.123Z"
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString()
}

/**
 * Formats a hash or ID string with optional truncation and ellipsis.
 *
 * @param hash - The hash string to format
 * @param length - Optional length to truncate to (default: 8). If <= 0, returns full hash.
 * @returns Truncated hash with ellipsis if applicable
 *
 * @example
 * formatHash("a1b2c3d4e5f6") // "a1b2c3d4..."
 * formatHash("a1b2c3d4e5f6", 12) // "a1b2c3d4e5f6"
 * formatHash("a1b2c3d4e5f6", 0) // "a1b2c3d4e5f6"
 */
export function formatHash(hash: string, length: number = 8): string {
  if (length <= 0 || hash.length <= length) {
    return hash
  }
  return `${hash.slice(0, length)}...`
}

/**
 * Formats a number with proper tabular numeral formatting.
 * Uses locale-aware formatting with grouping separators.
 *
 * @param num - The number to format
 * @returns Formatted number string with grouping separators
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(42) // "42"
 * formatNumber(1234.56) // "1,234.56"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: true,
  })
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 * Automatically selects appropriate unit (ms, s, m, h, d).
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable duration string
 *
 * @example
 * formatDuration(500) // "500ms"
 * formatDuration(5000) // "5s"
 * formatDuration(65000) // "1m 5s"
 * formatDuration(3665000) // "1h 1m"
 * formatDuration(90000000) // "1d 1h"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) {
    return '0ms'
  }

  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return `${seconds}s`
}

/**
 * Formats bytes to a human-readable file size string.
 * Uses binary prefixes (KiB, MiB, GiB, TiB) for precision.
 *
 * @param bytes - Size in bytes
 * @returns Human-readable size string with 2 decimal places
 *
 * @example
 * formatBytes(1024) // "1.00 KiB"
 * formatBytes(1536) // "1.50 KiB"
 * formatBytes(1048576) // "1.00 MiB"
 * formatBytes(500) // "500 B"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 0) {
    return '0 B'
  }

  if (bytes === 0) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)

  return `${value.toFixed(2)} ${units[exponent]}`
}

export function formatCurrency(amount: number, opts?: { maximumFractionDigits?: number }): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
