/**
 * Image URL validation and sanitization utilities
 * Ensures only valid HTTPS URLs are used (no local file paths)
 */

/**
 * Check if a URL is a valid HTTPS image URL (not a local file path)
 * @param {string|null|undefined} url - URL to validate
 * @returns {boolean} - True if valid HTTPS URL, False otherwise
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Reject local file paths
  if (url.startsWith('file://') || url.startsWith('file:/')) {
    console.warn('Invalid URL (local file path rejected):', url);
    return false;
  }

  // Reject Windows local paths (C:\, D:\, etc.)
  if (/^[A-Za-z]:[/\\]/.test(url)) {
    console.warn('Invalid URL (Windows path rejected):', url);
    return false;
  }

  // Reject relative paths that look like local paths
  if (url.includes('://') && !url.startsWith('http')) {
    console.warn('Invalid URL (non-HTTP protocol rejected):', url);
    return false;
  }

  // Must be HTTPS URL
  if (!url.startsWith('https://')) {
    console.warn('Invalid URL (must be HTTPS):', url);
    return false;
  }

  return true;
};

/**
 * Get a safe image URL, returning a placeholder if invalid
 * @param {string|null|undefined} url - URL to sanitize
 * @param {string} placeholder - Placeholder URL or data URI to use if invalid
 * @returns {string} - Valid URL or placeholder
 */
export const getSafeImageUrl = (url, placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==') => {
  if (isValidImageUrl(url)) {
    return url;
  }
  return placeholder;
};

/**
 * Check if URL needs re-upload (is invalid local path)
 * @param {string|null|undefined} url - URL to check
 * @returns {boolean} - True if URL is invalid and needs re-upload
 */
export const needsReupload = (url) => {
  if (!url) return false;
  
  return (
    url.startsWith('file://') ||
    url.startsWith('file:/') ||
    /^[A-Za-z]:[/\\]/.test(url) ||
    (url.includes('://') && !url.startsWith('http'))
  );
};

