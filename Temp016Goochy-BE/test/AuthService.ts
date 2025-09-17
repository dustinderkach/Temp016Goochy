import { SignInOutput, fetchAuthSession, signIn } from "@aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { Temp016GoochyAuthStack } from "../outputs.json";

const awsRegion = process.env.AWS_REGION// || "us-east-1";

Amplify.configure({
	Auth: {
		Cognito: {
			userPoolId: Temp016GoochyAuthStack.Temp016GoochyUserPoolId,
			userPoolClientId:
				Temp016GoochyAuthStack.Temp016GoochyUserPoolClientId,
			identityPoolId: Temp016GoochyAuthStack.Temp016GoochyIdentityPoolId,
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
		const cognitoIdentityPool = `cognito-idp.${awsRegion}.amazonaws.com/${Temp016GoochyAuthStack.Temp016GoochyUserPoolId}`;
		const cognitoIdentity = new CognitoIdentityClient({
			credentials: fromCognitoIdentityPool({
				identityPoolId:
					Temp016GoochyAuthStack.Temp016GoochyIdentityPoolId,
				logins: {
					[cognitoIdentityPool]: idToken,
				},
			}),
		});
		const credentials = await cognitoIdentity.config.credentials();
		return credentials;
	}
}
