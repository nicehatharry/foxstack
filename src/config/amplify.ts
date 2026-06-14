/**
 * Configures the Amplify library with the Cognito User Pool and Identity Pool.
 * This module must be imported ONCE at the very top of src/main.tsx,
 * before any other imports that touch auth or AWS services.
 *
 * Usage:
 *   import './config/amplify';   // side-effect import — runs Amplify.configure()
 */

import { Amplify } from 'aws-amplify';
import { awsConfig } from './aws';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId:       awsConfig.userPoolId,
      userPoolClientId: awsConfig.userPoolClientId,
      identityPoolId:   awsConfig.identityPoolId,
    },
  },
});