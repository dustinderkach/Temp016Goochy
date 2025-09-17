import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from "aws-lambda";
import { postTemp015Goochy as postTemp015Goochy } from "./PostTemp015Goochy";
import { getTemp015Goochy } from "./GetTemp015Goochy";
import { updateTemp015Goochy } from "./UpdateTemp015Goochy";
import { deleteTemp015Goochy } from "./DeleteTemp015Goochy";
import { JsonError, MissingFieldError } from "../shared/Validator";
import { addCorsHeader } from "../shared/Utils";
import { captureAWSv3Client, getSegment } from "aws-xray-sdk-core";
import { getPresignedUrlAdminBucket } from "./getPresignedUrlAdminBucket";

//const ddbClient = captureAWSv3Client(new DynamoDBClient({}));
const ddbClient = captureAWSv3Client
	? captureAWSv3Client(new DynamoDBClient({ region: process.env.AWS_REGION }))
	: new DynamoDBClient({ region: process.env.AWS_REGION });

async function handlerTemp015Goochy(
	event: APIGatewayProxyEvent,
	context: Context
): Promise<APIGatewayProxyResult> {
	console.log("Lambda function invoked");
	console.log("Event path:", event.path);
	console.log("HTTP Method:", event.httpMethod);
	console.log("Received event:", {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body ? event.body.substring(0, 100) : 'No body'  // Truncate for safety
});
	let response: APIGatewayProxyResult;

	try {
		switch (event.httpMethod) {
			case "OPTIONS":
				response = {
					statusCode: 200,
					body: "",
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods":
							"GET,POST,PUT,DELETE,OPTIONS",
						"Access-Control-Allow-Headers":
							"Content-Type,Authorization",
					},
				};
				break;
			case "GET":
				const subSegGET =
					getSegment().addNewSubsegment("GET-Temp015Goochy");
				const getResponse = await getTemp015Goochy(event, ddbClient);
				subSegGET.close();
				response = getResponse;
				break;
			case "POST":
				if (event.path.includes("get-presigned-url")) {
					const subSegPOST = getSegment().addNewSubsegment(
						"POST-GetPresignedUrl"
					);
					const presignedUrlResponse =
						await getPresignedUrlAdminBucket(event);
					subSegPOST.close();
					response = presignedUrlResponse;
				} else {
					const subSegPOST =
						getSegment().addNewSubsegment("POST-Temp015Goochy");
					const postResponse = await postTemp015Goochy(
						event,
						ddbClient
					);
					subSegPOST.close();
					response = postResponse;
				}
				break;

			case "PUT":
				const subSegPUT =
					getSegment().addNewSubsegment("PUT-Temp015Goochy");
				const putResponse = await updateTemp015Goochy(event, ddbClient);
				subSegPUT.close();
				response = putResponse;
				break;
			case "DELETE":
				const subSegDELETE = getSegment().addNewSubsegment(
					"DELETE-Temp015Goochy"
				);
				const deleteResponse = await deleteTemp015Goochy(
					event,
					ddbClient
				);
				subSegDELETE.close();
				response = deleteResponse;
				break;
			default:
				response = {
					statusCode: 405,
					body: JSON.stringify({ message: "Method not allowed" }),
				};
				break;
		}
	} catch (error) {
		if (error instanceof MissingFieldError) {
			return {
				statusCode: 400,
				body: error.message,
			};
		}
		if (error instanceof JsonError) {
			return {
				statusCode: 400,
				body: error.message,
			};
		}
		return {
			statusCode: 500,
			body: error.message,
		};
	}
	addCorsHeader(response);
	return response;
}

export { handlerTemp015Goochy };
