import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('🔐 [useAuth] Hook state:', { hasUser: !!user, loading });

  useEffect(() => {
    console.log('🔐 [useAuth] useEffect triggered');
    
    // Check if Supabase client is available
    if (!supabase) {
      console.error('❌ [useAuth] Supabase client not initialized!');
      setLoading(false);
      return;
    }

    console.log('✅ [useAuth] Supabase client available');

    // Get initial session
    const getInitialSession = async () => {
      console.log('🔍 [useAuth] Fetching initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [useAuth] Error getting session:', error);
        } else if (session) {
          console.log('✅ [useAuth] Initial session found:', {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at,
          });
          setUser(session.user);
        } else {
          console.log('⚠️  [useAuth] No initial session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [useAuth] Exception getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Subscribe to auth state changes
    console.log('👂 [useAuth] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 [useAuth] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
        });
        
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    console.log('✅ [useAuth] Auth state listener active');

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 [useAuth] Cleaning up auth listener');
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    console.log('🔑 [useAuth.signIn] Attempting sign in:', { email });
    
    if (!supabase) {
      console.error('❌ [useAuth.signIn] Supabase client not initialized');
      return { user: null, error: new Error('Supabase client not initialized') };
    }

    try {
      setLoading(true);
      console.log('📡 [useAuth.signIn] Calling supabase.auth.signInWithPassword...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [useAuth.signIn] Sign in error:', error);
        throw error;
      }

      console.log('✅ [useAuth.signIn] Sign in successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        hasSession: !!data.session,
      });

      setUser(data.user);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ [useAuth.signIn] Exception during sign in:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async ({ redirectTo, skipBrowserRedirect = false, queryParams } = {}) => {
    console.log('🔑 [useAuth.signInWithGoogle] Attempting Google sign in');

    if (!supabase) {
      console.error('❌ [useAuth.signInWithGoogle] Supabase client not initialized');
      return { data: null, error: new Error('Supabase client not initialized') };
    }

    try {
      setLoading(true);

      const resolvedRedirectTo = redirectTo ?? (
        typeof window !== 'undefined'
          ? `${window.location.origin}/onboard/dashboard`
          : undefined
      );

      const oauthOptions = {
        skipBrowserRedirect,
      };

      if (resolvedRedirectTo) {
        oauthOptions.redirectTo = resolvedRedirectTo;
      }

      if (queryParams) {
        oauthOptions.queryParams = queryParams;
      }

      console.log('📡 [useAuth.signInWithGoogle] Calling supabase.auth.signInWithOAuth...', {
        hasRedirect: !!oauthOptions.redirectTo,
        skipBrowserRedirect,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: oauthOptions,
      });

      if (error) {
        console.error('❌ [useAuth.signInWithGoogle] OAuth error:', error);
        throw error;
      }

      if (skipBrowserRedirect) {
        setLoading(false);
      }

      console.log('✅ [useAuth.signInWithGoogle] OAuth request successful');
      return { data, error: null };
    } catch (error) {
      console.error('❌ [useAuth.signInWithGoogle] Exception during OAuth sign in:', error);
      setLoading(false);
      return { data: null, error };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, options = {}) => {
    console.log('📝 [useAuth.signUp] Attempting sign up:', {
      email,
      hasRedirect: !!options?.emailRedirectTo,
    });
    
    if (!supabase) {
      console.error('❌ [useAuth.signUp] Supabase client not initialized');
      return { user: null, error: new Error('Supabase client not initialized') };
    }

    try {
      setLoading(true);
      console.log('📡 [useAuth.signUp] Calling supabase.auth.signUp...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        console.error('❌ [useAuth.signUp] Sign up error:', error);
        throw error;
      }

      console.log('✅ [useAuth.signUp] Sign up successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        hasSession: !!data.session,
        needsEmailConfirmation: !data.session,
      });

      // Note: User may need to confirm email depending on Supabase settings
      setUser(data.user);
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('❌ [useAuth.signUp] Exception during sign up:', error);
      return { user: null, session: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    console.log('👋 [useAuth.signOut] Attempting sign out...');
    
    if (!supabase) {
      console.error('❌ [useAuth.signOut] Supabase client not initialized');
      return { error: new Error('Supabase client not initialized') };
    }

    try {
      setLoading(true);
      
      // Check if there's a current session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️  [useAuth.signOut] No session to clear - user already signed out');
        setUser(null);
        return { error: null };
      }
      
      console.log('📡 [useAuth.signOut] Calling supabase.auth.signOut...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ [useAuth.signOut] Sign out error:', error);
        throw error;
      }

      console.log('✅ [useAuth.signOut] Sign out successful');
      setUser(null);
      return { error: null };
    } catch (error) {
      // Don't throw on AuthSessionMissingError - just log it
      if (error.message?.includes('Auth session missing')) {
        console.warn('⚠️  [useAuth.signOut] AuthSessionMissingError - treating as success');
        setUser(null);
        return { error: null };
      }
      
      console.error('❌ [useAuth.signOut] Exception during sign out:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
  };
}
