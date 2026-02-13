/**
 * Self-hosted mode utilities.
 * When NEXT_PUBLIC_SELF_HOSTED=true, the app runs against Firebase emulators
 * with anonymous auth (no Google login required).
 */
export const isSelfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === 'true';
