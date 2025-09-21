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
import { APP_NAME, APP_NAME_LOWER } from "../../config/appConfig";

interface AppApiStackProps extends StackProps {
	appLambdaIntegration: LambdaIntegration;
	userPool: IUserPool;
	env: { account: string; region: string };
	envName: string;
}

export class AppApiStack extends Stack {
	constructor(scope: Construct, id: string, props: AppApiStackProps) {
		super(scope, id, props);

		const api = new RestApi(this, `${props.envName}-${APP_NAME}Api`, {
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
			`${props.envName}-${APP_NAME}ApiAuthorizer`,
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
			`${props.envName}-${APP_NAME_LOWER}-get-presigned-url`
		);
		presignedUrlResource.addMethod(
			"POST",
			props.appLambdaIntegration,
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
		const appResource = api.root.addResource(
			`${props.envName}-${APP_NAME_LOWER}`
		);
		appResource.addMethod(
			"GET",
			props.appLambdaIntegration,
			optionsWithAuth
		);
		appResource.addMethod(
			"POST",
			props.appLambdaIntegration,
			optionsWithAuth
		);
		appResource.addMethod(
			"PUT",
			props.appLambdaIntegration,
			optionsWithAuth
		);
		appResource.addMethod(
			"DELETE",
			props.appLambdaIntegration,
			optionsWithAuth
		);
		appResource.addMethod(
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

		const apiEndpointApp = `${api.url}${props.envName}-${APP_NAME_LOWER}`;
		const apiEndpointPreSign = `${api.url}${props.envName}-${APP_NAME_LOWER}-get-presigned-url`;
		console.log("API-Endpoint thing: " + apiEndpointApp);
		console.log(
			"Pre-signed resource path:",
			`${props.envName}-${APP_NAME_LOWER}-get-presigned-url`
		);
		console.log("Exported pre-signed endpoint:", apiEndpointPreSign);

		new CfnOutput(this, `${props.envName}-${APP_NAME}ApiEndpoint`, {
			value: apiEndpointApp,
			description: `The endpoint of the ${APP_NAME} API`,
			exportName: `${props.envName}-${APP_NAME}ApiEndpoint`,
		});
		new CfnOutput(
			this,
			`${props.envName}-${APP_NAME}ApiEndpointPreSignAdminPhoto`,
			{
				value: apiEndpointPreSign,
				description: `The endpoint of the ${APP_NAME} API`,
				exportName: `${props.envName}-${APP_NAME}ApiEndpointPreSignAdminPhoto`,
			}
		);
	}
}
