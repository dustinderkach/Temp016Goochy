import {
	DynamoDBClient,
	PutItemCommand,
	GetItemCommand,
	UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
	// Maximum requests per user per time window
	maxRequests: 10,
	// Time window in seconds (5 minutes)
	windowSeconds: 300,
	// Use existing replicated table
	tableName: process.env.TABLE_NAME,
};

/**
 * Rate limiter using DynamoDB for distributed rate limiting
 */
export class RateLimiter {
	private ddbClient: DynamoDBClient;

	constructor() {
		if (!process.env.TABLE_NAME) {
			throw new Error(
				"TABLE_NAME environment variable is required for rate limiting"
			);
		}
		this.ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
	}

	/**
	 * Checks if user has exceeded rate limit
	 * @param userId - User identifier
	 * @param action - Action being rate limited (e.g., 'presigned-url')
	 * @returns Promise<{allowed: boolean, remaining: number, resetTime: number}>
	 */
	async checkRateLimit(
		userId: string,
		action: string
	): Promise<{
		allowed: boolean;
		remaining: number;
		resetTime: number;
	}> {
		if (!userId || typeof userId !== "string") {
			throw new Error("Invalid userId provided to checkRateLimit");
		}

		if (!action || typeof action !== "string") {
			throw new Error("Invalid action provided to checkRateLimit");
		}

		const key = `RATE_LIMIT#${userId}:${action}`;
		const now = Math.floor(Date.now() / 1000);
		const windowStart = now - RATE_LIMIT_CONFIG.windowSeconds;
		let resetTime = now + RATE_LIMIT_CONFIG.windowSeconds;

		try {
			// Get current rate limit data
			const getResult = await this.ddbClient.send(
				new GetItemCommand({
					TableName: RATE_LIMIT_CONFIG.tableName,
					Key: marshall({ id: key }),
				})
			);

			let requestCount = 0;
			if (getResult.Item) {
				const item = unmarshall(getResult.Item);
				if (item.resetTime > now) {
					// Within current window
					requestCount = item.requestCount || 0;
					resetTime = resetTime;
				}
			}

			// Check if limit exceeded
			if (requestCount >= RATE_LIMIT_CONFIG.maxRequests) {
				return {
					allowed: false,
					remaining: 0,
					resetTime: resetTime,
				};
			}

			// Increment counter
			// Use UpdateItemCommand for atomic increment
			await this.ddbClient.send(
				new UpdateItemCommand({
					TableName: RATE_LIMIT_CONFIG.tableName,
					Key: marshall({ id: key }),
					UpdateExpression:
						"SET requestCount = if_not_exists(requestCount, :zero) + :inc, resetTime = :resetTime, #ttl = :ttl",
					ExpressionAttributeNames: {
						"#ttl": "ttl",
					},
					ExpressionAttributeValues: marshall({
						":inc": 1,
						":zero": 0,
						":resetTime": resetTime,
						":ttl": resetTime + 86400,
					}),
				})
			);

			return {
				allowed: true,
				remaining: RATE_LIMIT_CONFIG.maxRequests - requestCount - 1,
				resetTime: resetTime,
			};
		} catch (error) {
			console.error("Rate limiting error:", error);
			// On error, allow request but log the issue
			return {
				allowed: true,
				remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
				resetTime: resetTime,
			};
		}
	}
}
