import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { APP_NAME } from "../../config/appConfig";

interface AppTableReplicaAttributes {
	tableName: string;
	tableArn: string;
	region: string;
}



interface AppDataStackProps extends StackProps {
	allRegions: string[];
	envName: string;
}

export class AppDataStack extends Stack {
	public readonly primaryAppTable: dynamodb.TableV2;
	public readonly primaryConfigTable: dynamodb.TableV2;
	public readonly deploymentBucket: IBucket;
	public readonly photosBucket: IBucket;
	public readonly AppTables: AppTableReplicaAttributes[] = [];

	constructor(
		scope: Construct,
		id: string,
		props: AppDataStackProps
	) {
		super(scope, id, props);

		const primaryRegion = props.env?.region;
		const AppTableName = `${props.envName}-${APP_NAME}Table`;

		const replicaRegions: dynamodb.ReplicaTableProps[] = props.allRegions
			.filter((region) => region !== primaryRegion)
			.map((region) => ({ region, contributorInsights: false }));

		// Create the primary table and replicas
		this.primaryAppTable = this.createAppPrimaryAndReplicaTables(
			AppTableName,
			props.envName,
			props.allRegions,
			replicaRegions
		);


	}

	// Method to get the replica table for a specific region
	public getAppTableByRegion(
		region: string
	): AppTableReplicaAttributes | undefined {
		return this.AppTables.find(
			(replica) => replica.region === region
		) as AppTableReplicaAttributes;
	}


	private createAppPrimaryAndReplicaTables(
		tableName: string,
		envName: string,
		allRegions: string[],
		replicaRegions: dynamodb.ReplicaTableProps[]
	): dynamodb.TableV2 {
		// Create the primary DynamoDB table with replicas
		const primaryTable = new dynamodb.TableV2(this, tableName, {
			partitionKey: {
				name: "id",
				type: dynamodb.AttributeType.STRING,
			},
			billing: dynamodb.Billing.onDemand(),
			contributorInsights: true,
			pointInTimeRecovery: true,
			tableClass: dynamodb.TableClass.STANDARD,
			removalPolicy: RemovalPolicy.DESTROY,
			tableName: tableName,
			replicas: replicaRegions,
		});

		// Add replicas to the replicaAppTables array and create outputs
		allRegions.forEach((region) => {
			const arn = `arn:aws:dynamodb:${region}:${this.account}:table/${tableName}`;
			this.AppTables.push({
				tableName: tableName,
				tableArn: arn,
				region: region,
			});

			// Create CfnOutput for each replica table
			new CfnOutput(this, `${tableName}-${region}`, {
				value: tableName,
				description: `Table name in ${region}`,
				exportName: `${envName}-${APP_NAME}TableName-${region}`,
			});

			new CfnOutput(this, `${envName}-${APP_NAME}TableArn-${region}`, {
				value: arn,
				description: `Table ARN in ${region}`,
				exportName: `${envName}-${APP_NAME}TableArn-${region}`,
			});
		});

		return primaryTable;
	}

}
