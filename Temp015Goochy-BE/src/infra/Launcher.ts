import { App } from "aws-cdk-lib";
import { Temp015GoochyApiStack } from "./stacks/Temp015GoochyApiStack";
import { Temp015GoochyDataStack } from "./stacks/Temp015GoochyDataStack";
import { Temp015GoochyLambdaStack } from "./stacks/Temp015GoochyLambdaStack";
import { Temp015GoochyAuthStack } from "./stacks/Temp015GoochyAuthStack";
import { Temp015GoochyUiDeploymentStack } from "./stacks/Temp015GoochyUiDeploymentStack";
import { Temp015GoochyMonitorStack } from "./stacks/Temp015GoochyMonitorStack";
import { Temp015GoochyS3Stack } from "./stacks/Temp015GoochyS3Stack";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

const app = new App();

// Get environment from CDK cli context, default to DEV, e.g., cdk deploy -c env=UAT or cdk deploy --context env=UAT
const envName = app.node.tryGetContext("env") || "DEV";
// Get environments from CDK context (cdk.json)
const environments = app.node.tryGetContext("environments");

if (!environments[envName]) {
	throw new Error(`Environment "${envName}" not found in environments list.`);
}

const env = environments[envName];

console.log(
	`🚀 Deploying to environment: ${envName} (Account: ${env.account}, Region: ${env.primaryRegion})`
);

// Note: A new region will need to be bootstrapped in the CDK CLI before deploying to a new region
// Bootstrapped: US East (N. Virginia) - us-east-1, EU (Frankfurt) - eu-central-1, Asia Pacific (Singapore) - ap-southeast-1
// e.g., cdk bootstrap aws://094106269614/eu-central-1
const allRegions = [env.primaryRegion, "eu-central-1"];

// Create a global S3 stack, in one region as it's CDN and global.
const s3Stack = new Temp015GoochyS3Stack(
	app,
	`${envName}-Temp015GoochyS3Stack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		envName: envName,
	}
);

// Deploy Auth stack only in a single region (global authentication).
const authStack = new Temp015GoochyAuthStack(
	app,
	`${envName}-Temp015GoochyAuthStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		photosBucket: s3Stack.photosBucket,
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: Auth stack depends on S3 stack
authStack.addDependency(s3Stack);

const dataStack = new Temp015GoochyDataStack(
	app,
	`${envName}-Temp015GoochyDataStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		allRegions: allRegions,
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: Data stack depends on Auth stack
dataStack.addDependency(authStack);

allRegions.forEach((region) => {
	const appReplicaTable = dataStack.getAppTableByRegion(region); //

	console.log(`Checking tables for region: ${region}`);
	console.log("App Replica Table:", JSON.stringify(appReplicaTable, null, 2));

	if (appReplicaTable) {
		let regionName = region;
		if (region === env.primaryRegion) {
			regionName = "PrimaryRegion";
		}
		console.log(
			`The table name for this region: ${regionName}, tableName:   ${appReplicaTable.tableName}`
		);

		let lambdaStack = new Temp015GoochyLambdaStack(
			app,
			`${envName}-Temp015GoochyLambdaStack-${regionName}`,
			{
				env: { account: env.account, region },
				tableArn: appReplicaTable.tableArn,
				tableName: appReplicaTable.tableName,
				crossRegionReferences: true,
				envName: envName,
				bucketName: s3Stack.photosBucket.bucketName,
				bucketArn: s3Stack.photosBucket.bucketArn,
			}
		);
		console.log("Starting-API-Stack");
		// For Deploy/Destroy purposes add dependency: Lambda stack depends on Data stack
		lambdaStack.addDependency(dataStack);

		let apiStack = new Temp015GoochyApiStack(
			app,
			`${envName}-Temp015GoochyApiStack${regionName}`,
			{
				env: { account: env.account, region },
				crossRegionReferences: true,
				temp015GoochyLambdaIntegration:
					lambdaStack.temp015GoochyLambdaIntegration,
				userPool: authStack.userPool, // Use global user pool
				envName: envName,
			}
		);

		// For Deploy/Destroy purposes add dependency: Lambda stack depends on Data stack
		apiStack.addDependency(lambdaStack);
	} else {
		console.error(`Missing tables for region: ${region}`);
	}
});

// (Optional) Deploy the UI & monitor stacks in one region
const uiDeploymentStack = new Temp015GoochyUiDeploymentStack(
	app,
	`${envName}-Temp015GoochyUiDeploymentStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: UI Deployment stack depends on Auth stack
uiDeploymentStack.addDependency(authStack);

const monitorStack = new Temp015GoochyMonitorStack(
	app,
	`${envName}-Temp015GoochyMonitorStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
	}
);

//  For Deploy/Destroy purposes add dependency: dMonitor stack depends on Data stack
monitorStack.addDependency(dataStack);
