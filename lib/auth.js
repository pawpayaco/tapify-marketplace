import { supabase } from './supabase';

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{user: object|null, error: Error|null}>}
 */
export async function signUp(email, password) {
  if (!supabase) {
    return { user: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Sign in an existing user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{user: object|null, error: Error|null}>}
 */
export async function signIn(email, password) {
  if (!supabase) {
    return { user: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  if (!supabase) {
    return { error: new Error('Supabase client not initialized') };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
}

/**
 * Get the current user session
 * @returns {Promise<{user: object|null, session: object|null}>}
 */
export async function getSession() {
  if (!supabase) {
    return { user: null, session: null };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return { user: session?.user ?? null, session };
  } catch (error) {
    console.error('Error getting session:', error);
    return { user: null, session: null };
  }
}

/**
 * Check if a user is an admin
 * @param {string} userId - User's ID
 * @returns {Promise<boolean>}
 */
export async function isUserAdmin(userId) {
  if (!supabase || !userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

