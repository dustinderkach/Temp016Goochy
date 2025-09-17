import {
	DynamoDBClient,
	GetItemCommand,
	PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateAsTemp015GoochyEntry } from "../shared/Validator";
import { marshall } from "@aws-sdk/util-dynamodb";
import { createRandomId, parseJSON } from "../shared/Utils";


export async function postTemp015Goochy(
	event: APIGatewayProxyEvent,
	ddbClient: DynamoDBClient
): Promise<APIGatewayProxyResult> {
	const randomId = createRandomId();
	const item = parseJSON(event.body);
	item.id = randomId;
	validateAsTemp015GoochyEntry(item);


	const result = await ddbClient.send(
		new PutItemCommand({
			TableName: process.env.TABLE_NAME,
			Item: marshall(item),
		})
	);

	return {
		statusCode: 201,
		body: JSON.stringify({ id: randomId }),
	};
}
