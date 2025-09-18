import {
	DeleteItemCommand,
	DynamoDBClient,
	UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { hasAdminGroup } from "../shared/Utils";

export async function deleteTemp016Goochy(
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
		const temp016GoochyId = event.queryStringParameters["id"];

		await ddbClient.send(
			new DeleteItemCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					id: { S: temp016GoochyId },
				},
			})
		);

		return {
			statusCode: 200,
			body: JSON.stringify(`Deleted temp016Goochy with id ${temp016GoochyId}`),
		};
	}
	return {
		statusCode: 400,
		body: JSON.stringify("Please provide right args!!"),
	};
}
