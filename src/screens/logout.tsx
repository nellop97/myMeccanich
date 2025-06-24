import { FirebaseAuthTypes, getAuth } from '@react-native-firebase/auth';
import { appleAuth } from '@invertase/react-native-apple-authentication';

async function revokeSignInWithAppleToken() {
  // Get an authorizationCode from Apple
  const { authorizationCode } = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.REFRESH,
  });

  // Ensure Apple returned an authorizationCode
  if (!authorizationCode) {
    throw new Error('Apple Revocation failed - no authorizationCode returned');
  }

  // Revoke the token
  return revokeToken(getAuth(), authorizationCode);
}

function revokeToken(arg0: FirebaseAuthTypes.Module, authorizationCode: string) {
    throw new Error('Function not implemented.');
}
