import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
	CfnIdentityPool,
	CfnIdentityPoolRoleAttachment,
	CfnUserPoolGroup,
	UserPool,
	UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import {
	Effect,
	FederatedPrincipal,
	PolicyStatement,
	Role,
} from "aws-cdk-lib/aws-iam";
import {
	Bucket,
	HttpMethods,
	IBucket,
	ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface Temp015GoochyAuthStackProps extends StackProps {
	envName: string;
	photosBucket: IBucket;
	env: { account: string; region: string };
}

export class Temp015GoochyAuthStack extends Stack {
	public userPool: UserPool;
	private props: Temp015GoochyAuthStackProps;
	private userPoolClient: UserPoolClient;
	private identityPool: CfnIdentityPool;
	private authenticatedRole: Role;
	private unAuthenticatedRole: Role;
	private adminRole: Role;

	constructor(
		scope: Construct,
		id: string,
		props: Temp015GoochyAuthStackProps
	) {
		super(scope, id, props);
		this.props = props;

		this.createUserPool();
		this.createUserPoolClient();
		this.createIdentityPool();
		this.createRoles(props.photosBucket);
		this.attachRoles();
		this.createAdminsGroup();

		// Output the primary region name
		if (props.env && props.env.region) {
			new CfnOutput(this, "PrimaryRegionName", {
				value: props.env.region,
				description: "The primary region name",
			});
		}

		new CfnOutput(this, `Environment-Name-${props.envName}`, {
			value: props.envName,
			description: "The environment name",
		});

		
	}


	private createUserPool() {
		this.userPool = new UserPool(
			this,
			`${this.props.envName}-Temp015GoochyUserPool`,
			{
				selfSignUpEnabled: true,
				signInAliases: {
					username: true,
					email: true,
				},
			}
		);

		new CfnOutput(this, `${this.props.envName}-Temp015GoochyUserPoolId`, {
			value: this.userPool.userPoolId,
		});
	}

	private createUserPoolClient() {
		this.userPoolClient = this.userPool.addClient(
			`${this.props.envName}-Temp015GoochyUserPoolClient`,
			{
				authFlows: {
					adminUserPassword: true,
					custom: true,
					userPassword: true,
					userSrp: true,
				},
			}
		);
		new CfnOutput(
			this,
			`${this.props.envName}-Temp015GoochyUserPoolClientId`,
			{
				value: this.userPoolClient.userPoolClientId,
			}
		);
	}

	private createAdminsGroup() {
		new CfnUserPoolGroup(
			this,
			`${this.props.envName}-Temp015GoochyAdmins`,
			{
				userPoolId: this.userPool.userPoolId,
				groupName: "admins",
				roleArn: this.adminRole.roleArn,
			}
		);
	}

	private createIdentityPool() {
		this.identityPool = new CfnIdentityPool(
			this,
			`${this.props.envName}-Temp015GoochyIdentityPool`,
			{
				allowUnauthenticatedIdentities: true,
				cognitoIdentityProviders: [
					{
						clientId: this.userPoolClient.userPoolClientId,
						providerName: this.userPool.userPoolProviderName,
					},
				],
			}
		);
		new CfnOutput(
			this,
			`${this.props.envName}-Temp015GoochyIdentityPoolId`,
			{
				value: this.identityPool.ref,
			}
		);
	}

	private createRoles(photosBucket: IBucket) {
		this.authenticatedRole = new Role(
			this,
			"CognitoDefaultAuthenticatedRole",
			{
				assumedBy: new FederatedPrincipal(
					"cognito-identity.amazonaws.com",
					{
						StringEquals: {
							"cognito-identity.amazonaws.com:aud":
								this.identityPool.ref,
						},
						"ForAnyValue:StringLike": {
							"cognito-identity.amazonaws.com:amr":
								"authenticated",
						},
					},
					"sts:AssumeRoleWithWebIdentity"
				),
			}
		);

		// Attach policy to allow s3:PutObject
		this.authenticatedRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["s3:PutObject"],
				resources: [`${photosBucket.bucketArn}/*`],
			})
		);

		this.unAuthenticatedRole = new Role(
			this,
			"CognitoDefaultUnauthenticatedRole",
			{
				assumedBy: new FederatedPrincipal(
					"cognito-identity.amazonaws.com",
					{
						StringEquals: {
							"cognito-identity.amazonaws.com:aud":
								this.identityPool.ref,
						},
						"ForAnyValue:StringLike": {
							"cognito-identity.amazonaws.com:amr":
								"unauthenticated",
						},
					},
					"sts:AssumeRoleWithWebIdentity"
				),
			}
		);
		this.adminRole = new Role(this, "CognitoAdminRole", {
			assumedBy: new FederatedPrincipal(
				"cognito-identity.amazonaws.com",
				{
					StringEquals: {
						"cognito-identity.amazonaws.com:aud":
							this.identityPool.ref,
					},
					"ForAnyValue:StringLike": {
						"cognito-identity.amazonaws.com:amr": "authenticated",
					},
				},
				"sts:AssumeRoleWithWebIdentity"
			),
		});
		this.adminRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["s3:PutObject", "s3:PutObjectAcl"],
				resources: [`arn:aws:s3:::${photosBucket.bucketName}/*`],
			})
		);
		this.adminRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["s3:ListAllMyBuckets"],
				resources: ["*"],
			})
		);
	}

	private attachRoles() {
		new CfnIdentityPoolRoleAttachment(
			this,
			`${this.props.envName}-RolesAttachment`,
			{
				identityPoolId: this.identityPool.ref,
				roles: {
					authenticated: this.authenticatedRole.roleArn,
					unauthenticated: this.unAuthenticatedRole.roleArn,
				},
				roleMappings: {
					adminsMapping: {
						type: "Token",
						ambiguousRoleResolution: "AuthenticatedRole",
						identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
					},
				},
			}
		);
	}


}
