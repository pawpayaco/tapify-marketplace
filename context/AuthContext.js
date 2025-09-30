import { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth';

// Create the Auth Context
const AuthContext = createContext(undefined);

// AuthProvider component that wraps the app
export function AuthProvider({ children }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the AuthContext
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
