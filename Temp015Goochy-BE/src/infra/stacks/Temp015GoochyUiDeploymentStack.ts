import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { join } from "path";
import { existsSync } from "fs";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { AccessLevel, Distribution } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

interface Temp015GoochyS3StackProps extends StackProps {
	envName: string;
}

export class Temp015GoochyUiDeploymentStack extends Stack {
	constructor(
		scope: Construct,
		id: string,
		props?: Temp015GoochyS3StackProps
	) {
		super(scope, id, props);

		const suffix = getSuffixFromStack(this);

		const deploymentBucket = new Bucket(this, "uiDeploymentBucket", {
			bucketName: `${props.envName.toLowerCase()}-temp015goochy-fe-${suffix}`,
		});

		const uiDir = join(
			__dirname,
			"..",
			"..",
			"..",
			"..",
			"Temp015Goochy-FE",
			"dist"
		);
		if (!existsSync(uiDir)) {
			console.warn("Ui dir not found: " + uiDir);
			return;
		}

		new BucketDeployment(
			this,
			`${props.envName.toLowerCase()}Temp015GoochyDeployment`,
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
			`${props.envName.toLowerCase()}Temp015GoochyDistribution`,
			{
				defaultRootObject: "index.html",
				defaultBehavior: {
					origin: s3Origin,
				},
			}
		);

		new CfnOutput(
			this,
			`${props.envName.toLowerCase()}Temp015GoochyDistributionDomainName`,
			{
				value: distribution.distributionDomainName,
			}
		);


	}


}
