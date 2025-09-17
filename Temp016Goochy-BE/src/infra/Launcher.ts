import { App } from "aws-cdk-lib";
import { Temp016GoochyApiStack } from "./stacks/Temp016GoochyApiStack";
import { Temp016GoochyDataStack } from "./stacks/Temp016GoochyDataStack";
import { Temp016GoochyLambdaStack } from "./stacks/Temp016GoochyLambdaStack";
import { Temp016GoochyAuthStack } from "./stacks/Temp016GoochyAuthStack";
import { Temp016GoochyUiDeploymentStack } from "./stacks/Temp016GoochyUiDeploymentStack";
import { Temp016GoochyMonitorStack } from "./stacks/Temp016GoochyMonitorStack";
import { Temp016GoochyS3Stack } from "./stacks/Temp016GoochyS3Stack";
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
const s3Stack = new Temp016GoochyS3Stack(
	app,
	`${envName}-Temp016GoochyS3Stack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		envName: envName,
	}
);

// Deploy Auth stack only in a single region (global authentication).
const authStack = new Temp016GoochyAuthStack(
	app,
	`${envName}-Temp016GoochyAuthStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		photosBucket: s3Stack.photosBucket,
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: Auth stack depends on S3 stack
authStack.addDependency(s3Stack);

const dataStack = new Temp016GoochyDataStack(
	app,
	`${envName}-Temp016GoochyDataStack`,
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

		let lambdaStack = new Temp016GoochyLambdaStack(
			app,
			`${envName}-Temp016GoochyLambdaStack-${regionName}`,
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

		let apiStack = new Temp016GoochyApiStack(
			app,
			`${envName}-Temp016GoochyApiStack${regionName}`,
			{
				env: { account: env.account, region },
				crossRegionReferences: true,
				temp016GoochyLambdaIntegration:
					lambdaStack.temp016GoochyLambdaIntegration,
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
const uiDeploymentStack = new Temp016GoochyUiDeploymentStack(
	app,
	`${envName}-Temp016GoochyUiDeploymentStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: UI Deployment stack depends on Auth stack
uiDeploymentStack.addDependency(authStack);

const monitorStack = new Temp016GoochyMonitorStack(
	app,
	`${envName}-Temp016GoochyMonitorStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
	}
);

//  For Deploy/Destroy purposes add dependency: dMonitor stack depends on Data stack
monitorStack.addDependency(dataStack);
