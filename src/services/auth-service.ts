// ══════════════════════════════════════════════════════════════
//  AgriSense — Authentication Service
//  User login, session management, and role-based access
// ══════════════════════════════════════════════════════════════

export interface User {
  username: string;
  password: string;
  role: 'admin' | 'user';
  name: string;
}

export interface CurrentUser {
  username: string;
  role: 'admin' | 'user';
  name: string;
  loginTime: number;
}

const SESSION_KEY = 'agrisense_session';
const USERS_DB: Record<string, User> = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator',
  },
  petani: {
    username: 'petani',
    password: 'petani123',
    role: 'user',
    name: 'Petani',
  },
};

let currentUser: CurrentUser | null = null;

// Initialize session from localStorage
export function initializeSession(): boolean {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    const parsed = session ? JSON.parse(session) : null;

    if (parsed && USERS_DB[parsed.username]) {
      const user = USERS_DB[parsed.username];
      currentUser = {
        username: parsed.username,
        role: user.role,
        name: user.name,
        loginTime: parsed.loginTime,
      };
      console.log('[Auth] Session restored for:', parsed.username);
      return true;
    }
  } catch (err) {
    console.warn('[Auth] Failed to restore session:', err);
  }

  currentUser = null;
  return false;
}

// Save session to localStorage
function saveSession(username: string): void {
  try {
    const session = {
      username,
      loginTime: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('[Auth] Failed to save session:', err);
  }
}

// Login user
export function login(username: string, password: string): boolean {
  const user = USERS_DB[username];

  if (!user || user.password !== password) {
    console.warn('[Auth] Login failed for:', username);
    return false;
  }

  currentUser = {
    username,
    role: user.role,
    name: user.name,
    loginTime: Date.now(),
  };

  saveSession(username);
  console.log('[Auth] Logged in as:', username);
  return true;
}

// Logout user
export function logout(): void {
  currentUser = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('[Auth] Failed to clear session:', err);
  }
  console.log('[Auth] Logged out');
}

// Get current user
export function getCurrentUser(): CurrentUser | null {
  return currentUser;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return currentUser !== null;
}

// Check if user is admin
export function isAdmin(): boolean {
  return currentUser?.role === 'admin';
}

// Get session duration (minutes)
export function getSessionDuration(): number {
  if (!currentUser) return 0;
  return Math.floor((Date.now() - currentUser.loginTime) / 1000 / 60);
}

// Verify credentials (for testing UI)
export function verifyCredentials(username: string, password: string): User | null {
  const user = USERS_DB[username];
  return user && user.password === password ? user : null;
}
