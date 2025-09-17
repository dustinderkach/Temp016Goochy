import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
	AuthorizationType,
	CfnMethod,
	CognitoUserPoolsAuthorizer,
	Cors,
	LambdaIntegration,
	MethodOptions,
	MockIntegration,
	PassthroughBehavior,
	ResourceOptions,
	RestApi,
	AccessLogFormat,
	LogGroupLogDestination,
	MethodLoggingLevel,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface Temp015GoochyApiStackProps extends StackProps {
	temp015GoochyLambdaIntegration: LambdaIntegration;
	userPool: IUserPool;
	env: { account: string; region: string };
	envName: string;
}

export class Temp015GoochyApiStack extends Stack {
	constructor(
		scope: Construct,
		id: string,
		props: Temp015GoochyApiStackProps
	) {
		super(scope, id, props);

		const api = new RestApi(this, `${props.envName}-Temp015GoochyApi`, {
			deployOptions: {
				accessLogDestination: new LogGroupLogDestination(
					new LogGroup(this, `${props.envName}-ApiAccessLogs`)
				),
				accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
				loggingLevel: MethodLoggingLevel.INFO,
			},
		});

		const authorizer = new CognitoUserPoolsAuthorizer(
			this,
			`${props.envName}-Temp015GoochyApiAuthorizer`,
			{
				cognitoUserPools: [props.userPool],
				identitySource: "method.request.header.Authorization",
			}
		);

		const optionsWithAuth: MethodOptions = {
			authorizationType: AuthorizationType.COGNITO,
			authorizer: authorizer,
		};

		const optionsWithoutAuth: MethodOptions = {
			authorizationType: AuthorizationType.NONE,
		};

		// Create CORS mock integration for OPTIONS methods
		const corsIntegration = new MockIntegration({
			integrationResponses: [
				{
					statusCode: "200",
					responseParameters: {
						"method.response.header.Access-Control-Allow-Headers":
							"'Content-Type,Authorization'",
						"method.response.header.Access-Control-Allow-Origin":
							"'*'",
						"method.response.header.Access-Control-Allow-Methods":
							"'GET,POST,PUT,DELETE,OPTIONS'",
					},
				},
			],
			passthroughBehavior: PassthroughBehavior.NEVER,
			requestTemplates: {
				"application/json": '{"statusCode": 200}',
			},
		});

		const corsMethodResponse = {
			statusCode: "200",
			responseParameters: {
				"method.response.header.Access-Control-Allow-Headers": true,
				"method.response.header.Access-Control-Allow-Methods": true,
				"method.response.header.Access-Control-Allow-Origin": true,
			},
		};

		// Presigned URL resource
		const presignedUrlResource = api.root.addResource(
			`${props.envName}-get-presigned-url`
		);
		presignedUrlResource.addMethod(
			"POST",
			props.temp015GoochyLambdaIntegration,
			optionsWithAuth
		);
		presignedUrlResource.addMethod(
			"OPTIONS",
			new MockIntegration({
				integrationResponses: [
					{
						statusCode: "200",
						responseParameters: {
							"method.response.header.Access-Control-Allow-Headers":
								"'Content-Type,Authorization'",
							"method.response.header.Access-Control-Allow-Origin":
								"'*'",
							"method.response.header.Access-Control-Allow-Methods":
								"'POST,OPTIONS'",
						},
					},
				],
				passthroughBehavior: PassthroughBehavior.NEVER,
				requestTemplates: {
					"application/json": '{"statusCode": 200}',
				},
			}),
			{
				authorizationType: AuthorizationType.NONE,
				methodResponses: [
					{
						statusCode: "200",
						responseParameters: {
							"method.response.header.Access-Control-Allow-Headers":
								true,
							"method.response.header.Access-Control-Allow-Origin":
								true,
							"method.response.header.Access-Control-Allow-Methods":
								true,
						},
					},
				],
			}
		);

		// Main resource
		const temp015GoochyResource = api.root.addResource(
			`${props.envName}-temp015Goochy`
		);
		temp015GoochyResource.addMethod(
			"GET",
			props.temp015GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp015GoochyResource.addMethod(
			"POST",
			props.temp015GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp015GoochyResource.addMethod(
			"PUT",
			props.temp015GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp015GoochyResource.addMethod(
			"DELETE",
			props.temp015GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp015GoochyResource.addMethod(
			"OPTIONS",
			new MockIntegration({
				integrationResponses: [
					{
						statusCode: "200",
						responseParameters: {
							"method.response.header.Access-Control-Allow-Headers":
								"'Content-Type,Authorization'",
							"method.response.header.Access-Control-Allow-Origin":
								"'*'",
							"method.response.header.Access-Control-Allow-Methods":
								"'GET,POST,PUT,DELETE,OPTIONS'",
						},
					},
				],
				passthroughBehavior: PassthroughBehavior.NEVER,
				requestTemplates: {
					"application/json": '{"statusCode": 200}',
				},
			}),
			{
				authorizationType: AuthorizationType.NONE,
				methodResponses: [
					{
						statusCode: "200",
						responseParameters: {
							"method.response.header.Access-Control-Allow-Headers":
								true,
							"method.response.header.Access-Control-Allow-Origin":
								true,
							"method.response.header.Access-Control-Allow-Methods":
								true,
						},
					},
				],
			}
		);

		const apiEndpointApp = `${api.url}${props.envName}-temp015Goochy`;
		const apiEndpointPreSign = `${api.url}${props.envName}-get-presigned-url`;
		console.log("API-Endpoint thing: " + apiEndpointApp);
		console.log(
			"Pre-signed resource path:",
			`${props.envName}-get-presigned-url`
		);
		console.log("Exported pre-signed endpoint:", apiEndpointPreSign);

		new CfnOutput(this, `${props.envName}-Temp015GoochyApiEndpoint`, {
			value: apiEndpointApp,
			description: "The endpoint of the Temp015Goochy API",
			exportName: `${props.envName}-Temp015GoochyApiEndpoint`,
		});
		new CfnOutput(
			this,
			`${props.envName}-Temp015GoochyApiEndpointPreSignAdminPhoto`,
			{
				value: apiEndpointPreSign,
				description: "The endpoint of the Temp015Goochy API",
				exportName: `${props.envName}-Temp015GoochyApiEndpointPreSignAdminPhoto`,
			}
		);
	}
}
