import { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth';

// Create the Auth Context
const AuthContext = createContext(undefined);

// AuthProvider component that wraps the app
export function AuthProvider({ children }) {
  try {
    const auth = useAuth();
    
    return (
      <AuthContext.Provider value={auth}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error('AuthProvider error:', error);
    // Still render children even if auth fails
    const fallbackAuth = {
      user: null,
      loading: false,
      signIn: async () => ({ user: null, error: 'Auth not configured' }),
      signUp: async () => ({ user: null, error: 'Auth not configured' }),
      signOut: async () => ({ error: 'Auth not configured' }),
    };
    
    return (
      <AuthContext.Provider value={fallbackAuth}>
        {children}
      </AuthContext.Provider>
    );
  }
}

// Custom hook to use the AuthContext
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    console.warn('useAuthContext used outside AuthProvider');
    // Return safe defaults instead of throwing
    return {
      user: null,
      loading: false,
      signIn: async () => ({ user: null, error: 'No auth context' }),
      signUp: async () => ({ user: null, error: 'No auth context' }),
      signOut: async () => ({ error: 'No auth context' }),
    };
  }

  return context;
}

export default AuthContext;