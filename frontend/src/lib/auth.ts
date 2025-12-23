import { cookies } from 'next/headers';

export type AuthUser = {
  userId: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

// Key for storing the authentication token in cookies
export const AUTH_TOKEN = 'authToken';

// Get the authenticated user's information
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN)?.value;
  if (!token) {
    return null;
  }

  // Fetch user information from the backend API
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/api/users/me`, {
      headers: {
        'Cookie': `${AUTH_TOKEN}=${token}`,
      },
      // Ensure we always get fresh data
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const user: AuthUser = await res.json();
    return user;

  } catch (err) {
    console.error('Error fetching auth user:', err);
    return null;
  }
}

// Check if the user is logged in
export async function isLoggedIn(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

// Check if the user has admin privileges
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.isAdmin ?? false;
}