import { type NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN, type AuthUser } from '@/lib/auth';

// User account related pages
const authPages = [
  '/account',
  '/account/edit',
  '/account/orders',
  '/account/password',
  '/account/favorites',
  '/order-confirm',
];

// Administrative pages
const adminPages = [
  '/admin/products',
  '/admin/products/register',
  '/admin/inquiries',
];

// Middleware function to protect routes
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the requested path is protected
  const isProtected = [...authPages, ...adminPages].some((path) =>
    pathname.startsWith(path)
  );

  // If not protected, allow the request
  if (!isProtected) return NextResponse.next();

  // Check for authentication token
  const token = request.cookies.get(AUTH_TOKEN)?.value;
  if (!token) {
    return redirectToLogin(request);
  }

  // Validate token with backend
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/api/users/me`, {
      headers: {
        'Cookie': `${AUTH_TOKEN}=${token}`,
      },
    });

    // Redirect to login if token is invalid
    if (!res.ok) {
      const response = redirectToLogin(request);
      response.cookies.delete({ name: AUTH_TOKEN, path: '/' });
      return response;
    }

    // Get user data
    const user = (await res.json()) as AuthUser;

    // Check for admin access if needed
    if (adminPages.some((path) => pathname.startsWith(path))) {
      if (!user.isAdmin) {
        return redirectToLogin(request);
      }
    }

    // Allow the request if all checks pass
    return NextResponse.next();

  } catch (err) {
    console.error('Error validating auth token:', err);
    return redirectToLogin(request);
  }
}

// Helper function to redirect to login with original URL
function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}