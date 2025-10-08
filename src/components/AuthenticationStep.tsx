import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useUser, useSignIn, useSignUp } from "../hooks/useClerkAuth";
import { CLERK_PUBLISHABLE_KEY } from "../lib/clerk";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  UserCircle,
  LogIn,
  UserPlus,
  ArrowRight,
  AlertCircle,
  Mail,
  Loader2,
  Sparkles,
} from "lucide-react";

// Google Logo Component
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);

// GitHub Logo Component
const GitHubLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9 0C4.0275 0 0 4.13211 0 9.22838C0 13.3065 2.5785 16.7648 6.15375 17.9841C6.60375 18.0709 6.76875 17.7853 6.76875 17.5403C6.76875 17.3212 6.76125 16.7405 6.7575 15.9712C4.254 16.5277 3.726 14.7332 3.726 14.7332C3.3165 13.6681 2.72475 13.3832 2.72475 13.3832C1.9095 12.8111 2.78775 12.8229 2.78775 12.8229C3.6915 12.887 4.16625 13.7737 4.16625 13.7737C4.96875 15.1847 6.273 14.777 6.7875 14.5414C6.8685 13.9443 7.10025 13.5381 7.3575 13.3065C5.35875 13.0749 3.258 12.2883 3.258 8.74869C3.258 7.74302 3.60675 6.92267 4.18425 6.27489C4.083 6.04302 3.77925 5.10205 4.263 3.82745C4.263 3.82745 5.01675 3.58024 6.738 4.77375C7.458 4.56916 8.223 4.46686 8.988 4.46294C9.753 4.46686 10.518 4.56916 11.238 4.77375C12.948 3.58024 13.7017 3.82745 13.7017 3.82745C14.1855 5.10205 13.8818 6.04302 13.7917 6.27489C14.3655 6.92267 14.7142 7.74302 14.7142 8.74869C14.7142 12.2977 12.6105 13.0712 10.608 13.2990C10.923 13.5797 11.2155 14.1377 11.2155 15.0026C11.2155 16.242 11.2043 17.2403 11.2043 17.5403C11.2043 17.7877 11.3625 18.0756 11.8207 17.9841C15.4237 16.7609 18 13.3046 18 9.22838C18 4.13211 13.9703 0 9 0Z"/>
  </svg>
);

// Form schemas
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

interface AuthenticationStepProps {
  onContinueWithoutAccount: () => void;
  onAuthComplete: () => void;
}

export default function AuthenticationStep({
  onContinueWithoutAccount,
  onAuthComplete,
}: AuthenticationStepProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "choose">("choose");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn() || {};
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp() || {};

  // Sign in form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Sign up form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // If Clerk is not configured, show a message
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Account Features Not Available
          </h2>
          <p className="text-stone-600">
            Account sync is not configured for this installation.
          </p>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200/60">
          <p className="text-sm text-amber-800">
            To enable account features, the app administrator needs to configure Clerk authentication
            with a VITE_CLERK_PUBLISHABLE_KEY in the .env file.
          </p>
        </div>

        <Button
          onClick={onContinueWithoutAccount}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Continue Setup Without Account
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // If user is already signed in, show success state
  if (isLoaded && isSignedIn && user) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Welcome back, {user.firstName || user.username || user.emailAddresses?.[0]?.emailAddress || "there"}!
          </h2>
          <p className="text-stone-600">
            You're signed in and ready to continue setup.
          </p>
        </div>
        <Button
          onClick={onAuthComplete}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Continue Setup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Handle sign in form submission
  const onSignIn = async (data: SignInFormData) => {
    if (!signIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === "complete" && setActiveSignIn) {
        await setActiveSignIn({ session: result.createdSessionId });
        onAuthComplete();
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up form submission
  const onSignUp = async (data: SignUpFormData) => {
    if (!signUp) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      if (result.status === "complete" && setActiveSignUp) {
        await setActiveSignUp({ session: result.createdSessionId });
        onAuthComplete();
      } else if (result.status === "missing_requirements") {
        // Handle email verification if needed
        setError("Please check your email to verify your account.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth sign in (Google, GitHub)
  const handleOAuthSignIn = async (provider: "oauth_google" | "oauth_github") => {
    if (!signIn) return;

    setIsLoading(true);
    setError(null);
    setInfo(null);

    try {
      // For Electron apps, we need to handle OAuth in external browser
      // Use Clerk's authenticateWithRedirect but intercept the redirect

      const redirectUrl = "openwhispr://auth-callback";
      const redirectUrlComplete = window.location.origin + window.location.pathname;

      // Listen for OAuth callback BEFORE starting the flow
      const handleOAuthCallback = async (event: any, url: string) => {
        console.log("OAuth callback received:", url);

        try {
          // Parse the callback URL
          const urlObj = new URL(url);

          // Check if this is our auth callback
          if (urlObj.protocol === 'openwhispr:' && urlObj.hostname === 'auth-callback') {
            setInfo("Processing authentication...");

            // Get the rotating token from Clerk
            const rotatingToken = urlObj.searchParams.get('__clerk_rotating_token');
            const clerkTicket = urlObj.searchParams.get('__clerk_ticket');

            console.log("Callback params:", {
              rotatingToken: rotatingToken ? 'present' : 'missing',
              clerkTicket: clerkTicket ? 'present' : 'missing',
              allParams: Array.from(urlObj.searchParams.entries())
            });

            if (rotatingToken || clerkTicket) {
              // Clerk should handle the session automatically via the SDK
              // Wait for the session to be established
              await new Promise(resolve => setTimeout(resolve, 2000));

              setInfo("Authentication complete!");

              // Cleanup listener
              if (window.electronAPI?.removeAllListeners) {
                window.electronAPI.removeAllListeners('oauth-callback');
              }

              // Trigger re-check by calling onAuthComplete after a brief delay
              setTimeout(() => {
                onAuthComplete();
              }, 500);
            } else {
              // Check for error parameters
              const error = urlObj.searchParams.get('error');
              const errorDescription = urlObj.searchParams.get('error_description');

              if (error) {
                setError(`Authentication failed: ${errorDescription || error}`);
              } else {
                setError("Authentication failed: No valid response from provider");
              }
              setIsLoading(false);
            }
          }
        } catch (parseError) {
          console.error("Error parsing OAuth callback:", parseError);
          setError("Authentication failed: Invalid callback URL");
          setIsLoading(false);
        }
      };

      // Register callback listener BEFORE opening OAuth
      if (window.electronAPI?.onOAuthCallback) {
        // Remove any existing listeners first
        if (window.electronAPI?.removeAllListeners) {
          window.electronAPI.removeAllListeners('oauth-callback');
        }
        window.electronAPI.onOAuthCallback(handleOAuthCallback);
      } else {
        setError("OAuth not supported in this environment");
        setIsLoading(false);
        return;
      }

      // Start the OAuth flow
      // This will trigger a redirect that we'll intercept
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: redirectUrl,
        redirectUrlComplete: redirectUrlComplete,
      });

      // Note: authenticateWithRedirect will attempt to redirect the page
      // We need to intercept this and open in external browser instead
      // This is handled by preventing the default navigation and opening externally

      setInfo(
        provider === 'oauth_google'
          ? "Opening Google sign-in in your browser..."
          : "Opening GitHub sign-in in your browser..."
      );

    } catch (err: any) {
      console.error("OAuth error:", err);

      // If authenticateWithRedirect fails, it might be because Clerk tried to navigate
      // Let's check if there's a navigation attempt we can intercept
      setError(err.message || "Unable to start authentication. Please try email sign-in instead.");
      setIsLoading(false);
    }
  };

  if (mode === "signin") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Sign In to Your Account
          </h2>
          <p className="text-stone-600">
            Welcome back! Sign in to sync your settings across devices.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {info && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">{info}</p>
          </div>
        )}

        <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...signInForm.register("email")}
              disabled={isLoading}
            />
            {signInForm.formState.errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {signInForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...signInForm.register("password")}
              disabled={isLoading}
            />
            {signInForm.formState.errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {signInForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4 mr-2" />
            )}
            Sign In
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-500">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("oauth_google")}
            disabled={isLoading}
          >
            <GoogleLogo />
            <span className="ml-2">Google</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("oauth_github")}
            disabled={isLoading}
          >
            <GitHubLogo />
            <span className="ml-2">GitHub</span>
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setMode("choose");
              setError(null);
              setInfo(null);
              signInForm.reset();
            }}
            disabled={isLoading}
          >
            Back to options
          </Button>

          <Button
            variant="ghost"
            onClick={onContinueWithoutAccount}
            className="text-stone-600 hover:text-stone-900"
            disabled={isLoading}
          >
            Continue without creating an account
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-stone-600">
            Sign up to sync your settings and unlock premium features.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {info && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">{info}</p>
          </div>
        )}

        <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...signUpForm.register("email")}
              disabled={isLoading}
            />
            {signUpForm.formState.errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              {...signUpForm.register("password")}
              disabled={isLoading}
            />
            {signUpForm.formState.errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...signUpForm.register("confirmPassword")}
              disabled={isLoading}
            />
            {signUpForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">
                {signUpForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Create Account
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-500">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("oauth_google")}
            disabled={isLoading}
          >
            <GoogleLogo />
            <span className="ml-2">Google</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("oauth_github")}
            disabled={isLoading}
          >
            <GitHubLogo />
            <span className="ml-2">GitHub</span>
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setMode("choose");
              setError(null);
              setInfo(null);
              signUpForm.reset();
            }}
            disabled={isLoading}
          >
            Back to options
          </Button>

          <Button
            variant="ghost"
            onClick={onContinueWithoutAccount}
            className="text-stone-600 hover:text-stone-900"
            disabled={isLoading}
          >
            Continue without creating an account
          </Button>
        </div>
      </div>
    );
  }

  // Default "choose" mode
  return (
    <div className="space-y-6" style={{ fontFamily: "Noto Sans, sans-serif" }}>
      {/* Welcome Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2" style={{ fontFamily: "Noto Sans, sans-serif" }}>
          Welcome to OpenWhispr
        </h2>
        <p className="text-stone-600" style={{ fontFamily: "Noto Sans, sans-serif" }}>
          Let's set up your voice dictation in just a few simple steps.
        </p>
      </div>

      {/* OAuth Buttons at Top */}
      <div className="space-y-3">
        <p className="text-sm text-center text-stone-600 font-medium" style={{ fontFamily: "Noto Sans, sans-serif" }}>
          Continue with:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("oauth_google")}
            size="lg"
            className="border-stone-300 hover:bg-stone-50"
          >
            <GoogleLogo />
            <span className="ml-2">Google</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("oauth_github")}
            size="lg"
            className="border-stone-300 hover:bg-stone-50"
          >
            <GitHubLogo />
            <span className="ml-2">GitHub</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-stone-500">Or</span>
        </div>
      </div>

      {/* Email Sign In/Up Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => setMode("signin")}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Mail className="w-5 h-5 mr-2" />
          Sign In with Email
        </Button>

        <Button
          onClick={() => setMode("signup")}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Create Account with Email
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={onContinueWithoutAccount}
        className="w-full text-stone-600 hover:text-stone-900"
        size="lg"
      >
        Continue without creating an account
      </Button>

      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/60">
        <h4 className="font-medium text-blue-900 mb-2" style={{ fontFamily: "Noto Sans, sans-serif" }}>
          Benefits of creating an account:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1" style={{ fontFamily: "Noto Sans, sans-serif" }}>
          <li>✓ Sync settings across all your devices</li>
          <li>✓ Access your transcription history anywhere</li>
          <li>✓ Unlock advanced AI features</li>
          <li>✓ Priority support and updates</li>
        </ul>
      </div>
    </div>
  );
}