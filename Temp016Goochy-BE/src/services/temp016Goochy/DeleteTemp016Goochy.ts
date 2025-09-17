import {
	DeleteItemCommand,
	DynamoDBClient,
	UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { hasAdminGroup } from "../shared/Utils";
import { APP_NAME } from "../../config/appConfig";

export async function deleteAppEntry(
	event: APIGatewayProxyEvent,
	ddbClient: DynamoDBClient
): Promise<APIGatewayProxyResult> {
	if (!hasAdminGroup(event)) {
		return {
			statusCode: 401,
			body: JSON.stringify(`Not authorized!`),
		};
	}

	if (event.queryStringParameters && "id" in event.queryStringParameters) {
		const entryId = event.queryStringParameters["id"];

		await ddbClient.send(
			new DeleteItemCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					id: { S: entryId },
				},
			})
		);

		return {
			statusCode: 200,
			body: JSON.stringify(`Deleted ${APP_NAME} entry with id ${entryId}`),
		};
	}
	return {
		statusCode: 400,
		body: JSON.stringify("Please provide right args!!"),
	};
}
