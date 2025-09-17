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

interface Temp016GoochyApiStackProps extends StackProps {
	temp016GoochyLambdaIntegration: LambdaIntegration;
	userPool: IUserPool;
	env: { account: string; region: string };
	envName: string;
}

export class Temp016GoochyApiStack extends Stack {
	constructor(
		scope: Construct,
		id: string,
		props: Temp016GoochyApiStackProps
	) {
		super(scope, id, props);

		const api = new RestApi(this, `${props.envName}-Temp016GoochyApi`, {
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
			`${props.envName}-Temp016GoochyApiAuthorizer`,
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
			props.temp016GoochyLambdaIntegration,
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
		const temp016GoochyResource = api.root.addResource(
			`${props.envName}-temp016Goochy`
		);
		temp016GoochyResource.addMethod(
			"GET",
			props.temp016GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp016GoochyResource.addMethod(
			"POST",
			props.temp016GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp016GoochyResource.addMethod(
			"PUT",
			props.temp016GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp016GoochyResource.addMethod(
			"DELETE",
			props.temp016GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp016GoochyResource.addMethod(
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

		const apiEndpointApp = `${api.url}${props.envName}-temp016Goochy`;
		const apiEndpointPreSign = `${api.url}${props.envName}-get-presigned-url`;
		console.log("API-Endpoint thing: " + apiEndpointApp);
		console.log(
			"Pre-signed resource path:",
			`${props.envName}-get-presigned-url`
		);
		console.log("Exported pre-signed endpoint:", apiEndpointPreSign);

		new CfnOutput(this, `${props.envName}-Temp016GoochyApiEndpoint`, {
			value: apiEndpointApp,
			description: "The endpoint of the Temp016Goochy API",
			exportName: `${props.envName}-Temp016GoochyApiEndpoint`,
		});
		new CfnOutput(
			this,
			`${props.envName}-Temp016GoochyApiEndpointPreSignAdminPhoto`,
			{
				value: apiEndpointPreSign,
				description: "The endpoint of the Temp016Goochy API",
				exportName: `${props.envName}-Temp016GoochyApiEndpointPreSignAdminPhoto`,
			}
		);
	}
}
