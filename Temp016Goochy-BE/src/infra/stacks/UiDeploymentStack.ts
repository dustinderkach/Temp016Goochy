import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { join } from "path";
import { existsSync } from "fs";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { AccessLevel, Distribution } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { APP_NAME, APP_NAME_LOWER } from "../../config/appConfig";

interface AppS3StackProps extends StackProps {
	envName: string;
}

export class AppUIDeploymentStack extends Stack {
	constructor(scope: Construct, id: string, props?: AppS3StackProps) {
		super(scope, id, props);

		const suffix = getSuffixFromStack(this);

		const deploymentBucket = new Bucket(this, "uiDeploymentBucket", {
			bucketName: `${props.envName.toLowerCase()}-${APP_NAME_LOWER}-fe-${suffix}`,
		});

		const uiDir = join(
			__dirname,
			"..",
			"..",
			"..",
			"..",
			`${APP_NAME}-FE`,
			"dist"
		);
		if (!existsSync(uiDir)) {
			console.warn("Ui dir not found: " + uiDir);
			return;
		}

		new BucketDeployment(
			this,
			`${props.envName.toLowerCase()}${APP_NAME}Deployment`,
			{
				destinationBucket: deploymentBucket,
				sources: [Source.asset(uiDir)],
			}
		);

		const s3Origin = S3BucketOrigin.withOriginAccessControl(
			deploymentBucket,
			{
				originAccessLevels: [AccessLevel.READ],
			}
		);

		const distribution = new Distribution(
			this,
			`${props.envName.toLowerCase()}${APP_NAME}Distribution`,
			{
				defaultRootObject: "index.html",
				defaultBehavior: {
					origin: s3Origin,
				},
			}
		);

		new CfnOutput(
			this,
			`${props.envName.toLowerCase()}${APP_NAME}DistributionDomainName`,
			{
				value: distribution.distributionDomainName,
			}
		);
	}
}
