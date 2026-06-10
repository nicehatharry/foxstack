function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${key}". ` +
      `Add it in Amplify Console → App settings → Environment variables.`
    );
  }
  return value;
}

export const awsConfig = {
  region:         requireEnv('VITE_AWS_REGION'),
  identityPoolId: requireEnv('VITE_IDENTITY_POOL_ID'),
  s3: {
    bucket: requireEnv('VITE_S3_BUCKET'),
    key:    'grocery-lists/shared/list.json',
  },
} as const;
