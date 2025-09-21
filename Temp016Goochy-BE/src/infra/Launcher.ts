import { App } from "aws-cdk-lib";
import { AppApiStack } from "./stacks/ApiStack";
import { AppDataStack } from "./stacks/DataStack";
import { AppLambdaStack } from "./stacks/LambdaStack";
import { AppAuthStack } from "./stacks/AuthStack";
import { AppUIDeploymentStack } from "./stacks/UiDeploymentStack";
import { AppMonitorStack } from "./stacks/MonitorStack";
import { AppS3Stack } from "./stacks/S3Stack";
import { APP_NAME } from "../config/appConfig";

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

const s3Stack = new AppS3Stack(app, `${envName}-${APP_NAME}S3Stack`, {
	env: { account: env.account, region: env.primaryRegion },
	envName: envName,
});

// Deploy Auth stack only in a single region (global authentication).
const authStack = new AppAuthStack(app, `${envName}-${APP_NAME}AuthStack`, {
	env: { account: env.account, region: env.primaryRegion },
	photosBucket: s3Stack.photosBucket,
	envName: envName,
});

//  For Deploy/Destroy purposes add dependency: Auth stack depends on S3 stack
authStack.addDependency(s3Stack);

const dataStack = new AppDataStack(app, `${envName}-${APP_NAME}DataStack`, {
	env: { account: env.account, region: env.primaryRegion },
	allRegions: allRegions,
	envName: envName,
});

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

		let lambdaStack = new AppLambdaStack(
			app,
			`${envName}-${APP_NAME}LambdaStack-${regionName}`,
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

		let apiStack = new AppApiStack(
			app,
			`${envName}-${APP_NAME}ApiStack${regionName}`,
			{
				env: { account: env.account, region },
				crossRegionReferences: true,
				appLambdaIntegration: lambdaStack.appLambdaIntegration,
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

const uiDeploymentStack = new AppUIDeploymentStack(
	app,
	`${envName}-${APP_NAME}UiDeploymentStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: UI Deployment stack depends on Auth stack
uiDeploymentStack.addDependency(authStack);

const monitorStack = new AppMonitorStack(
	app,
	`${envName}-${APP_NAME}MonitorStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
	}
);

//  For Deploy/Destroy purposes add dependency: dMonitor stack depends on Data stack
monitorStack.addDependency(dataStack);
