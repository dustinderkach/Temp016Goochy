import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { handler } from "../../../src/services/temp016Goochy/handlerTemp016Goochy";

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

describe("Temp016Goochy handler test suite", () => {
	test("Returns temp016Goochy from dynamoDb", async () => {
		const result = await handler(
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

		expect(DynamoDBClient).toHaveBeenCalledTimes(1);
		expect(ScanCommand).toHaveBeenCalledTimes(1);
	});

	afterAll(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});
});
