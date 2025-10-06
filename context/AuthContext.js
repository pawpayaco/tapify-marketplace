import { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth';

// Create the Auth Context
const AuthContext = createContext(undefined);

// AuthProvider component that wraps the app
export function AuthProvider({ children }) {
  console.log('🔐 [AuthProvider] Initializing...');
  
  try {
    const auth = useAuth();
    
    console.log('✅ [AuthProvider] Auth hook loaded:', {
      hasUser: !!auth.user,
      loading: auth.loading,
      hasMethods: !!(auth.signIn && auth.signUp && auth.signOut),
    });
    
    return (
      <AuthContext.Provider value={auth}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error('❌ [AuthProvider] Error initializing auth:', error);
    // Still render children even if auth fails
    const fallbackAuth = {
      user: null,
      loading: false,
      signIn: async () => {
        console.error('❌ [AuthProvider] signIn called on fallback auth');
        return { user: null, error: 'Auth not configured' };
      },
      signUp: async () => {
        console.error('❌ [AuthProvider] signUp called on fallback auth');
        return { user: null, error: 'Auth not configured' };
      },
      signInWithGoogle: async () => {
        console.error('❌ [AuthProvider] signInWithGoogle called on fallback auth');
        return { data: null, error: 'Auth not configured' };
      },
      signOut: async () => {
        console.error('❌ [AuthProvider] signOut called on fallback auth');
        return { error: 'Auth not configured' };
      },
    };
    
    console.log('⚠️  [AuthProvider] Using fallback auth');
    
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
    console.error('❌ [useAuthContext] Used outside AuthProvider!');
    // Return safe defaults instead of throwing
    return {
      user: null,
      loading: false,
      signIn: async () => {
        console.error('❌ [useAuthContext] signIn called outside provider');
        return { user: null, error: 'No auth context' };
      },
      signUp: async () => {
        console.error('❌ [useAuthContext] signUp called outside provider');
        return { user: null, error: 'No auth context' };
      },
      signInWithGoogle: async () => {
        console.error('❌ [useAuthContext] signInWithGoogle called outside provider');
        return { data: null, error: 'No auth context' };
      },
      signOut: async () => {
        console.error('❌ [useAuthContext] signOut called outside provider');
        return { error: 'No auth context' };
      },
    };
  }

  console.log('🔐 [useAuthContext] Context accessed:', {
    hasUser: !!context.user,
    loading: context.loading,
  });

  return context;
}

export default AuthContext;
