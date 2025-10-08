import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  useSignIn as useClerkSignIn,
  useSignUp as useClerkSignUp,
} from "@clerk/clerk-react";
import { CLERK_PUBLISHABLE_KEY } from "../lib/clerk";

// Custom hooks that handle when Clerk is not configured
export function useAuth() {
  if (!CLERK_PUBLISHABLE_KEY) {
    // Return mock auth object when Clerk is not configured
    return {
      isSignedIn: false,
      isLoaded: true,
      userId: null,
      sessionId: null,
      signOut: async () => {},
    };
  }

  try {
    return useClerkAuth();
  } catch (error) {
    // Fallback if Clerk context is not available
    return {
      isSignedIn: false,
      isLoaded: true,
      userId: null,
      sessionId: null,
      signOut: async () => {},
    };
  }
}

export function useUser() {
  if (!CLERK_PUBLISHABLE_KEY) {
    // Return mock user object when Clerk is not configured
    return {
      user: null,
      isSignedIn: false,
      isLoaded: true,
    };
  }

  try {
    return useClerkUser();
  } catch (error) {
    // Fallback if Clerk context is not available
    return {
      user: null,
      isSignedIn: false,
      isLoaded: true,
    };
  }
}

export function useSignIn() {
  if (!CLERK_PUBLISHABLE_KEY) {
    // Return null when Clerk is not configured
    return null;
  }

  try {
    return useClerkSignIn();
  } catch (error) {
    // Fallback if Clerk context is not available
    return null;
  }
}

export function useSignUp() {
  if (!CLERK_PUBLISHABLE_KEY) {
    // Return null when Clerk is not configured
    return null;
  }

  try {
    return useClerkSignUp();
  } catch (error) {
    // Fallback if Clerk context is not available
    return null;
  }
}