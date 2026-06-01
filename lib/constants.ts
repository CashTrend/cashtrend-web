/**
 * Shared application-wide constants.
 *
 * Centralising these values ensures that changing a threshold or timing
 * parameter is a single-line edit rather than a hunt across multiple files.
 */

// ---------------------------------------------------------------------------
// Ticker search
// ---------------------------------------------------------------------------

/**
 * Minimum number of characters the user must type before a search request is
 * dispatched to the backend.  Prevents single/double-character queries from
 * hitting the expensive Yahoo Finance fallback path.
 */
export const TICKER_SEARCH_MIN_LENGTH = 3

/**
 * Milliseconds of typing inactivity after which the debounced search fires.
 * Resets on every keystroke, so the request only leaves when the user pauses.
 */
export const TICKER_SEARCH_DEBOUNCE_MS = 500
