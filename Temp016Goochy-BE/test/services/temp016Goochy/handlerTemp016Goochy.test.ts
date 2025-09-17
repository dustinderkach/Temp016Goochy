// Set required environment variables before importing modules
process.env.TABLE_NAME = "TestTable";
process.env.AWS_REGION = "us-east-1";

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { handlerApp } from "../../../src/services/temp016Goochy/handlerTemp016Goochy";

///This may not be a good way to mock the DynamoDBClient, it maybe better to use the AWS SDK mock

jest.mock("@aws-sdk/client-dynamodb", () => {
	return {
		DynamoDBClient: jest.fn().mockImplementation(() => {
			return {
				send: jest.fn().mockImplementation(() => {
					return {
						Items: someItems,
					};
				}),
			};
		}),
		ScanCommand: jest.fn(),
	};
});

const someItems = [
	{
		id: {
			S: "123",
		},
		location: {
			S: "Paris",
		},
	},
];

describe("App handler test suite", () => {
	test("Returns app from dynamoDb", async () => {
		const result = await handlerApp(
			{
				httpMethod: "GET",
			} as any,
			{} as any
		);

		expect(result.statusCode).toBe(201);
		const expectedResult = [
			{
				id: "123",
				location: "Paris",
			},
		];
		const parsedResultBody = JSON.parse(result.body);
		expect(parsedResultBody).toEqual(expectedResult);

		expect(DynamoDBClient).toHaveBeenCalledTimes(2); // One in handler, one in GetTemp016Goochy
		expect(ScanCommand).toHaveBeenCalledTimes(1);
	});

	afterAll(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});
});
