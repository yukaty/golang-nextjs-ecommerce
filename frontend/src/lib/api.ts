/**
 * Common API utilities for error handling and request formatting
 */

export interface ApiError {
  error: string;
}

/**
 * Handles API response and extracts error message if request failed
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<{ data: T | null; error: string | null }> {
  if (!response.ok) {
    try {
      const errorData = (await response.json()) as ApiError;
      return { data: null, error: errorData.error || 'Request failed.' };
    } catch {
      return { data: null, error: 'Request failed.' };
    }
  }

  try {
    const data = (await response.json()) as T;
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to parse response.' };
  }
}

/**
 * Creates fetch options with JSON content type
 */
export function createJsonRequest(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

