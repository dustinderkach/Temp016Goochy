import {
	SignInOutput,
	fetchAuthSession,
	signIn,
	getCurrentUser,
	AuthUser,
} from "@aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import outputs from '../config/outputsForFE.json';

export class AuthService {
	private user: SignInOutput | AuthUser | undefined;
	public jwtToken: string | undefined;
	private temporaryCredentials: object | undefined;
	private userName: string = "";
	public awsPrimaryRegion: string | undefined;
	public userPoolId: string | undefined;
	public identityPoolId: string | undefined;

	constructor() {
		this.initializeAuthService().catch((error) => {
			console.error("Failed to initialize AuthService:", error);
		});
	}

	private async initializeAuthService() {
		try {
			// Extract the required values from the imported config

			// Extract the required values from the JSON file
			const userPoolId = outputs.UserPoolId;
			const userPoolClientId = outputs.UserPoolClientId;
			const identityPoolId = outputs.IdentityPoolId;
			const awsPrimaryRegion = outputs.PrimaryRegionName;

			console.log("Environment:", outputs.EnvironmentName);
			console.log("userPoolId:", userPoolId);
			console.log("userPoolClientId:", userPoolClientId);
			console.log("identityPoolId:", identityPoolId);
			console.log("awsRegion:", awsPrimaryRegion);

			this.awsPrimaryRegion = awsPrimaryRegion;
			this.userPoolId = userPoolId;
			this.identityPoolId = identityPoolId;

			Amplify.configure({
				Auth: {
					Cognito: {
						userPoolId: userPoolId,
						userPoolClientId: userPoolClientId,
						identityPoolId: identityPoolId,
					},
				},
			});
		} catch (error) {
			console.error("Error initializing AuthService:", error);
		}
	}
	public isAuthorized() {
		if (this.user) {
			return true;
		}
		return false;
	}

	/**
	 * call only after login
	 */
	public async getIdToken() {
		const authSession = await fetchAuthSession();
		return authSession.tokens?.idToken?.toString();
	}

	public async login(
		userName: string,
		password: string
	): Promise<Object | undefined> {
		try {
			// check if user is already logged in
			const user = await this.getCurrentUser();
			if (user) {
				this.user = user;
			} else {
				const signInOutput: SignInOutput = await signIn({
					username: userName,
					password: password,
					options: {
						authFlowType: "USER_PASSWORD_AUTH",
					},
				});
				this.user = signInOutput;
			}

			this.userName = userName;
			this.jwtToken = await this.getIdToken();

			console.log(this.jwtToken);
			return this.user;
		} catch (error) {
			console.error(error);
			return undefined;
		}
	}

	private async getCurrentUser() {
		try {
			const user = await getCurrentUser();
			return user;
		} catch (error) {
			return undefined;
		}
	}

	public async getTemporaryCredentials() {
		if (this.temporaryCredentials) {
			return this.temporaryCredentials;
		}
		this.temporaryCredentials = await this.generateTemporaryCredentials();
		return this.temporaryCredentials;
	}

	public getUserName() {
		return this.userName;
	}

	private async generateTemporaryCredentials() {
		if (!this.jwtToken) {
			throw new Error("No JWT token found");
		}

		if (
			!this.awsPrimaryRegion ||
			!this.userPoolId ||
			!this.identityPoolId
		) {
			throw new Error(
				"Missing necessary AWS user pool configuration values"
			);
		}

		const cognitoIdentityPool = `cognito-idp.${this.awsPrimaryRegion}.amazonaws.com/${this.userPoolId}`;
		const cognitoIdentity = new CognitoIdentityClient({
			credentials: fromCognitoIdentityPool({
				clientConfig: {
					region: this.awsPrimaryRegion,
				},
				identityPoolId: this.identityPoolId,
				logins: {
					[cognitoIdentityPool]: this.jwtToken!,
				},
			}),
		});
		const credentials = await cognitoIdentity.config.credentials();
		return credentials;
	}
}
