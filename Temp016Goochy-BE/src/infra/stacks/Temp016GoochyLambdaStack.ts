import { CustomResource, Duration, Fn, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface Temp016GoochyLambdaStackProps extends StackProps {
	tableArn: string;
	tableName: string;
	envName: string;
	bucketName: string;
	bucketArn: string;
}

export class Temp016GoochyLambdaStack extends Stack {
	public readonly temp016GoochyLambdaIntegration: LambdaIntegration;

	constructor(
		scope: Construct,
		id: string,
		props: Temp016GoochyLambdaStackProps
	) {
		super(scope, id, props);
		//Note, AWS_REGION is avaiable in the Lambda runtime environment, so no need to pass it as an environment variable  Otherwise it will fail
		const temp016GoochyLambda = new NodejsFunction(
			this,
			`${props.envName}-Temp016GoochyLambda`,
			{
				runtime: Runtime.NODEJS_18_X,
				handler: "handlerTemp016Goochy",
				entry: join(
					__dirname,
					"..",
					"..", // Move up two directories to reach 'src'
					"services",
					"temp016Goochy",
					"handlerTemp016Goochy.ts"
				),
				environment: {
					TABLE_NAME: props.tableName,
					BUCKET_ARN: props.bucketArn,
					BUCKET_NAME: props.bucketName,
				},
				tracing: Tracing.ACTIVE,
				timeout: Duration.minutes(1),
				// bundling: {
				// 	minify: true,
				// 	sourceMap: true,
				// 	target: "node18",
				// 	externalModules: ["aws-sdk"], // Exclude AWS SDK since it's available in the Lambda runtime
				// },
			}
		);

		temp016GoochyLambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: [props.tableArn],
				actions: [
					"dynamodb:PutItem",
					"dynamodb:Scan",
					"dynamodb:GetItem",
					"dynamodb:UpdateItem",
					"dynamodb:DeleteItem",
				],
			})
		);

		// Add permissions for S3
		temp016GoochyLambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["s3:PutObject", "s3:GetObject"],
				resources: [`${props.bucketArn}/*`],
			})
		);

		this.temp016GoochyLambdaIntegration = new LambdaIntegration(
			temp016GoochyLambda
		);

		console.log("lambdastack BUCKET_ARN:", props.bucketArn);
		console.log("lambdastack AWS_REGION:", props.env?.region);
		// Grant permissions to the Custom Resource Lambda
	}
}
