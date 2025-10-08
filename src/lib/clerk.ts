export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Configure Clerk settings
export const clerkConfig = {
  appearance: {
    elements: {
      card: "shadow-lg rounded-2xl",
      headerTitle: "text-2xl font-bold text-stone-900",
      headerSubtitle: "text-stone-600",
      formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
      formButtonSecondary: "bg-stone-100 hover:bg-stone-200 text-stone-900",
      footerActionLink: "text-blue-600 hover:text-blue-700",
      identityPreviewText: "text-stone-900",
      identityPreviewEditButton: "text-blue-600",
      formFieldLabel: "text-stone-700",
      formFieldInput: "border-stone-300 focus:border-blue-500",
      dividerLine: "bg-stone-200",
      dividerText: "text-stone-500",
      socialButtonsBlockButton: "border-stone-300 hover:bg-stone-50",
      socialButtonsBlockButtonText: "text-stone-700",
    },
    layout: {
      socialButtonsPlacement: "bottom",
      showOptionalFields: false,
    }
  },
  signInUrl: undefined, // We'll handle routing internally
  signUpUrl: undefined,
  afterSignInUrl: undefined,
  afterSignUpUrl: undefined,
};