import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from "aws-lambda";
import { postAppEntry } from "./PostTemp016Goochy";
import { getAppEntry } from "./GetTemp016Goochy";
import { updateAppEntry } from "./UpdateTemp016Goochy";
import { deleteAppEntry } from "./DeleteTemp016Goochy";
import { JsonError, MissingFieldError } from "../shared/Validator";
import { addCorsHeader } from "../shared/Utils";
import { captureAWSv3Client, getSegment } from "aws-xray-sdk-core";
import { getPresignedUrlAdminBucket } from "./getPresignedUrlAdminBucket";
import { APP_NAME } from "../../config/appConfig";

// Helper function to safely create subsegments
function createSubsegment(name: string) {
	try {
		if (!process.env.JEST_WORKER_ID && getSegment) {
			return getSegment().addNewSubsegment(name);
		}
	} catch (error) {
		// X-Ray not available, return a mock subsegment
		console.log(`X-Ray not available, skipping subsegment: ${name}`);
	}
	return { close: () => {} }; // Mock subsegment
}

//const ddbClient = captureAWSv3Client(new DynamoDBClient({}));
const ddbClient = captureAWSv3Client && !process.env.JEST_WORKER_ID
	? captureAWSv3Client(new DynamoDBClient({ region: process.env.AWS_REGION }))
	: new DynamoDBClient({ region: process.env.AWS_REGION });

async function handlerApp(
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
				const subSegGET = createSubsegment(`GET-${APP_NAME}`);
				const getResponse = await getAppEntry(event, ddbClient);
				subSegGET.close();
				response = getResponse;
				break;
			case "POST":
				if (event.path.includes("get-presigned-url")) {
					const subSegPOST = createSubsegment("POST-GetPresignedUrl");
					const presignedUrlResponse =
						await getPresignedUrlAdminBucket(event);
					subSegPOST.close();
					response = presignedUrlResponse;
				} else {
					const subSegPOST = createSubsegment(`POST-${APP_NAME}`);
					const postResponse = await postAppEntry(
						event,
						ddbClient
					);
					subSegPOST.close();
					response = postResponse;
				}
				break;

			case "PUT":
				const subSegPUT = createSubsegment(`PUT-${APP_NAME}`);
				const putResponse = await updateAppEntry(event, ddbClient);
				subSegPUT.close();
				response = putResponse;
				break;
			case "DELETE":
				const subSegDELETE = createSubsegment(`DELETE-${APP_NAME}`);
				const deleteResponse = await deleteAppEntry(
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

export { handlerApp };
