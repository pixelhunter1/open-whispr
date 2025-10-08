# Clerk Authentication Setup Guide

OpenWhispr now supports optional user authentication through Clerk, allowing users to sync their settings across devices and access premium features.

## Setup Instructions

### 1. Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or select an existing one
3. Configure your application:
   - **Application Name**: OpenWhispr
   - **Sign-in methods**: Enable Email, Google, and GitHub

### 2. Configure OAuth Providers (Optional)

#### Google OAuth
1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Enable Google
3. Follow Clerk's guide to set up Google OAuth credentials

#### GitHub OAuth
1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Enable GitHub
3. Follow Clerk's guide to set up GitHub OAuth app

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env` (or `.env.local` for local development)
2. Add your Clerk Publishable Key:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

You can find your publishable key in the Clerk Dashboard under **API Keys**.

### 4. OAuth in Electron

For OAuth authentication (Google/GitHub), the app will:
1. Open the authentication flow in the user's default web browser
2. Handle the callback through Clerk's hosted pages
3. Automatically sync the session back to the Electron app

This is the industry-standard approach for desktop applications to ensure security and avoid embedding sensitive OAuth flows.

## Features When Authenticated

When users create an account or sign in, they get access to:
- Settings synchronization across devices
- Cloud backup of transcription history
- Priority support

## Running Without Authentication

The app works perfectly fine without Clerk configured. Users can:
- Use all local features
- Store settings locally
- Use OpenAI API directly
- Skip the authentication step during onboarding

Simply leave the `VITE_CLERK_PUBLISHABLE_KEY` empty or undefined to run without authentication features.

## Security Best Practices

1. **Never commit your `.env` file** - It's already in `.gitignore`
2. **Use environment-specific keys** - Different keys for development and production
3. **OAuth flows** - Always handled through the system browser, never embedded
4. **Session management** - Clerk handles secure session storage automatically

## Troubleshooting

### "Missing publishableKey" Error
- Ensure your `.env` file exists and contains `VITE_CLERK_PUBLISHABLE_KEY`
- Restart the development server after adding the key

### OAuth Not Working
- Check that OAuth providers are properly configured in Clerk Dashboard
- Ensure your default browser is set correctly
- Check that the app can open external URLs (system permissions)

### Session Not Persisting
- Clerk automatically handles session persistence
- Check browser cookies are enabled for Clerk domains
- Ensure the app has proper network access

## Development vs Production

### Development
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Production
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

Make sure to use the appropriate keys for each environment.