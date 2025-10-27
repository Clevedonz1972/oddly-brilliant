/**
 * Utility functions for formatting data
 */

/**
 * Format a date as relative time (e.g., "2 days ago", "1 hour ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now.getTime() - then.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Format a date as a short date string (e.g., "Jan 15, 2024")
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a number as currency (e.g., "$1,234.56")
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate text to a specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Get the display name for a contribution type with token value
 * @param type - Contribution type
 * @returns Object with display name and token value
 */
export function getContributionTypeInfo(type: string): { label: string; tokens: number; description: string } {
  const typeMap: Record<string, { label: string; tokens: number; description: string }> = {
    CODE: { label: 'Code Implementation', tokens: 30, description: 'Working code, bug fixes, or implementation' },
    DESIGN: { label: 'Design / UX', tokens: 25, description: 'UI/UX designs, mockups, or prototypes' },
    IDEA: { label: 'Idea / Approach', tokens: 20, description: 'Concepts, strategies, or approaches' },
    RESEARCH: { label: 'Research / Analysis', tokens: 15, description: 'Research findings, analysis, or documentation' },
  };

  return typeMap[type] || { label: type, tokens: 10, description: 'Contribution' };
}

/**
 * Format file size in bytes to human-readable string (e.g., "2.5 MB")
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a date with time (e.g., "Mar 15, 2024 at 2:30 PM")
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format percentage value
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Truncate blockchain transaction hash
 * @param hash - Transaction hash
 * @returns Truncated hash (8 chars + ... + 8 chars)
 */
export function truncateTxHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Get block explorer URL for transaction hash
 * @param txHash - Transaction hash
 * @param network - Blockchain network (default: ethereum)
 * @returns Block explorer URL
 */
export function getBlockExplorerUrl(txHash: string, network: string = 'ethereum'): string {
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
  };
  return `${explorers[network] || explorers.ethereum}${txHash}`;
}

/**
 * Format currency amount for screen readers (accessibility)
 * @param amount - Amount to format
 * @returns Spoken currency format
 */
export function formatCurrencySpoken(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  if (cents === 0) {
    return `${dollars} ${dollars === 1 ? 'dollar' : 'dollars'}`;
  }

  return `${dollars} ${dollars === 1 ? 'dollar' : 'dollars'} and ${cents} ${cents === 1 ? 'cent' : 'cents'}`;
}
