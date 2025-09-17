import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // Import getSignedUrl
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { hasAdminGroup, parseJSON } from "../shared/Utils";
import {
	isAllowedFileType,
	sanitizeFileName,
	generateUniqueFileName,
} from "../shared/FileValidation";
import { RateLimiter, RATE_LIMIT_CONFIG } from "../shared/RateLimiting";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const rateLimiter = new RateLimiter();

export async function getPresignedUrlAdminBucket(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	if (!hasAdminGroup(event)) {
		return {
			statusCode: 403,
			body: JSON.stringify({ message: "Admin access required" }),
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "OPTIONS,POST",
				"Access-Control-Allow-Headers": "Content-Type,Authorization",
			},
		};
	}

	// Rate limiting check
	const userId = event.requestContext.authorizer?.claims?.sub || "anonymous";
	const rateLimitResult = await rateLimiter.checkRateLimit(
		userId,
		"presigned-url"
	);

	if (!rateLimitResult.allowed) {
		return {
			statusCode: 429,
			body: JSON.stringify({
				message: "Rate limit exceeded. Please try again later.",
				resetTime: rateLimitResult.resetTime,
			}),
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "OPTIONS,POST",
				"Access-Control-Allow-Headers": "Content-Type,Authorization",
				"X-RateLimit-Limit": RATE_LIMIT_CONFIG.maxRequests.toString(),
				"X-RateLimit-Remaining": "0",
				"X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
			},
		};
	}

	try {
		const item = parseJSON(event.body);
		console.log("getPresignedUrlAdminBucket invoked with event:", {
			httpMethod: event.httpMethod,
			path: event.path,
			headers: event.headers,
			body: event.body,
		});
		if (!item || !item.fileName) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: "File name is required" }),
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "OPTIONS,POST",
					"Access-Control-Allow-Headers":
						"Content-Type,Authorization",
				},
			};
		}
		// Validate file type
		if (!isAllowedFileType(item.fileName)) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					message:
						"File type not allowed. Only JPEG, PNG, and WebP images are permitted.",
				}),
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "OPTIONS,POST",
					"Access-Control-Allow-Headers":
						"Content-Type,Authorization",
				},
			};
		}

		// Sanitize and generate unique file name
		const sanitizedFileName = sanitizeFileName(item.fileName);

		const uniqueFileName = generateUniqueFileName(
			sanitizedFileName,
			userId
		);

		const bucketName = process.env.BUCKET_NAME;
		if (!bucketName) {
			throw new Error(
				"Bucket name is not defined in environment variables"
			);
		}

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: uniqueFileName,
		});

		// Use getSignedUrl to generate the pre-signed URL
		const signedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: 3600,
		});

		return {
			statusCode: 200,
			body: JSON.stringify({
				url: signedUrl,
				fileName: uniqueFileName,
				originalFileName: item.fileName // Return the actual file name that will be used
			}),
			headers: {
				"Access-Control-Allow-Origin": "*", // Allow all origins
				"Access-Control-Allow-Methods": "OPTIONS,POST",
				"Access-Control-Allow-Headers": "Content-Type,Authorization",
			},
		};
	} catch (error) {
		console.error("Error generating pre-signed URL:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: "Failed to generate pre-signed URL",
			}),
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "OPTIONS,POST",
				"Access-Control-Allow-Headers": "Content-Type,Authorization",
			},
		};
	}
}
