import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from "aws-lambda";
import { postAppThing } from "./PostAppThing";
import { getAppThing } from "./GetAppThing";
import { updateAppThing } from "./UpdateAppThing";
import { deleteAppThing } from "./DeleteAppThing";
import { JsonError, MissingFieldError } from "../shared/Validator";
import { addCorsHeader } from "../shared/Utils";
import { captureAWSv3Client, getSegment } from "aws-xray-sdk-core";
import { getPresignedUrlAdminBucket } from "./getPresignedUrlAdminBucket";
import { APP_NAME } from "../../config/appConfig";

//const ddbClient = captureAWSv3Client(new DynamoDBClient({}));
const ddbClient = captureAWSv3Client
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
		body: event.body ? event.body.substring(0, 100) : "No body", // Truncate for safety
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
				const subSegGET = getSegment().addNewSubsegment(
					`GET-${APP_NAME}`
				);
				const getResponse = await getAppThing(event, ddbClient);
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
					const subSegPOST = getSegment().addNewSubsegment(
						`POST-${APP_NAME}`
					);
					const postResponse = await postAppThing(event, ddbClient);
					subSegPOST.close();
					response = postResponse;
				}
				break;

			case "PUT":
				const subSegPUT = getSegment().addNewSubsegment(
					`PUT-${APP_NAME}`
				);
				const putResponse = await updateAppThing(event, ddbClient);
				subSegPUT.close();
				response = putResponse;
				break;
			case "DELETE":
				const subSegDELETE = getSegment().addNewSubsegment(
					`DELETE-${APP_NAME}`
				);
				const deleteResponse = await deleteAppThing(event, ddbClient);
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
