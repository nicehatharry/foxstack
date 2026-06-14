/**
 * src/config/aws.ts
 *
 * Single source of truth for all AWS configuration.
 * Values are injected at build time via Vite environment variables —
 * no secrets or account identifiers ever live in source code.
 *
 * Set these in Amplify Console → App settings → Environment variables:
 *
 *   VITE_AWS_REGION             e.g.  us-east-1
 *   VITE_USER_POOL_ID           e.g.  us-east-1_AbCdEfGhI
 *   VITE_USER_POOL_CLIENT_ID    e.g.  xxxxxxxxxxxxxxxxxxxxxxxxxx
 *   VITE_IDENTITY_POOL_ID       e.g.  us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   VITE_S3_BUCKET              foxstack
 *
 * For local dev, create a .env.local file (already git-ignored by Vite).
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(
      `Missing required environment variable "${key}". ` +
      `Add it in Amplify Console → App settings → Environment variables.`
    );
  }
  return value;
}

export const awsConfig = {
  region:           requireEnv('VITE_AWS_REGION'),
  userPoolId:       requireEnv('VITE_USER_POOL_ID'),
  userPoolClientId: requireEnv('VITE_USER_POOL_CLIENT_ID'),
  identityPoolId:   requireEnv('VITE_IDENTITY_POOL_ID'),
  s3: {
    bucket: requireEnv('VITE_S3_BUCKET'),          // "foxstack"
    key:    'grocery-lists/list.json',       // one shared document for all users
  },
} as const;