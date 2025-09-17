import { Stack, StackProps, CfnOutput, PhysicalName } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { Bucket, HttpMethods, ObjectOwnership } from "aws-cdk-lib/aws-s3";
import { AnyPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { APP_NAME, APP_NAME_LOWER } from "../../config/appConfig";

interface AppS3StackProps extends StackProps {
	envName: string;
}

export class AppS3Stack extends Stack {
	public readonly photosBucket: Bucket;

	constructor(
		scope: Construct,
		id: string,
		props?: AppS3StackProps
	) {
		super(scope, id, props);

		const suffix = getSuffixFromStack(this);

		this.photosBucket = new Bucket(this, `${APP_NAME}AdminPhotos`, {
			bucketName: `${props.envName.toLowerCase()}-${APP_NAME_LOWER}-admin-photos-${suffix}`,
			cors: [
				{
					allowedMethods: [
						HttpMethods.HEAD,
						HttpMethods.GET,
						HttpMethods.PUT,
						HttpMethods.POST,
					],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"],
					exposedHeaders: ["ETag"], // Allow clients to access the ETag header
				},
			],
			objectOwnership: ObjectOwnership.OBJECT_WRITER,
			blockPublicAccess: {
				blockPublicAcls: false,
				blockPublicPolicy: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false,
			},
		});

		// Add a bucket policy to allow public read access
		this.photosBucket.addToResourcePolicy(
			new PolicyStatement({
				actions: ["s3:GetObject"],
				resources: [`${this.photosBucket.bucketArn}/*`], // Allow access to all objects in the bucket
				principals: [new AnyPrincipal()], // Use AnyPrincipal for public access
			})
		);

		new CfnOutput(this, "AdminPhotosBucketName", {
			value: this.photosBucket.bucketName,
			exportName: `${props?.envName}-${APP_NAME}AdminPhotosBucketName`,
		});
	}
}
