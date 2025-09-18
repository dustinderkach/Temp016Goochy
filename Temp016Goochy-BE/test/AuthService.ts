import { SignInOutput, fetchAuthSession, signIn } from "@aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
// import { Temp016GoochyAuthStack } from "../outputs.json"; // TODO: Uncomment when outputs.json is available

const awsRegion = process.env.AWS_REGION || "us-east-1";

// TODO: Replace these with actual values from outputs.json after deployment
const authConfig = {
	userPoolId: process.env.USER_POOL_ID || "us-east-1_lmgAhGGjX", // Replace with actual value
	userPoolClientId: process.env.USER_POOL_CLIENT_ID || "your-client-id", // Replace with actual value
	identityPoolId: process.env.IDENTITY_POOL_ID || "your-identity-pool-id", // Replace with actual value
};

Amplify.configure({
	Auth: {
		Cognito: {
			userPoolId: authConfig.userPoolId,
			userPoolClientId: authConfig.userPoolClientId,
			identityPoolId: authConfig.identityPoolId,
		},
	},
});

export class AuthService {
	public async login(userName: string, password: string) {
		const signInOutput: SignInOutput = await signIn({
			username: userName,
			password: password,
			options: {
				authFlowType: "USER_PASSWORD_AUTH",
			},
		});
		return signInOutput;
	}

	/**
	 * call only after login
	 */
	public async getIdToken() {
		const authSession = await fetchAuthSession();
		return authSession.tokens.idToken?.toString();
	}

	public async generateTemporaryCredentials() {
		const idToken = await this.getIdToken();
		const cognitoIdentityPool = `cognito-idp.${awsRegion}.amazonaws.com/${authConfig.userPoolId}`;
		const cognitoIdentity = new CognitoIdentityClient({
			credentials: fromCognitoIdentityPool({
				identityPoolId: authConfig.identityPoolId,
				logins: {
					[cognitoIdentityPool]: idToken,
				},
			}),
		});
		const credentials = await cognitoIdentity.config.credentials();
		return credentials;
	}
}
