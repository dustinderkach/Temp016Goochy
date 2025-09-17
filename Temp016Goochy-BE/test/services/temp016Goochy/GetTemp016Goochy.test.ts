import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getAppEntry } from "../../../src/services/temp016Goochy/GetTemp016Goochy";

const someItems = {
	Items: [
		{
			id: {
				S: "123",
			},
			location: {
				S: "Paris",
			},
		},
	],
};

const someItem = {
	Item: {
		id: {
			S: "123",
		},
		location: {
			S: "Paris",
		},
	},
};

describe("GetAppEntry test suite", () => {
	const ddbClientMock = {
		send: jest.fn(),
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	test("should return app entries if no queryStringParameters", async () => {
		ddbClientMock.send.mockResolvedValueOnce(someItems);
		const getResult = await getAppEntry({} as any, ddbClientMock as any);
		const expectedResult = {
			statusCode: 201,
			body: JSON.stringify([
				{
					id: "123",
					location: "Paris",
				},
			]),
		};
		expect(getResult).toEqual(expectedResult);
	});

	test("should return 400 if no id in queryStringParameters", async () => {
		const getResult = await getAppEntry(
			{
				queryStringParameters: {
					notId: "123",
				},
			} as any,
			ddbClientMock as any
		);
		const expectedResult = {
			statusCode: 400,
			body: JSON.stringify("Id required!"),
		};
		expect(getResult).toEqual(expectedResult);
	});

	test("should return 404 if id not found", async () => {
		ddbClientMock.send.mockResolvedValueOnce({});
		const getResult = await getAppEntry(
			{
				queryStringParameters: {
					id: "123",
				},
			} as any,
			ddbClientMock as any
		);
		const expectedResult = {
			statusCode: 404,
			body: JSON.stringify(`Temp016Goochy entry with id 123 not found!`),
		};
		expect(getResult).toEqual(expectedResult);
	});

	test("should return 200 if queryStringParameters with found id", async () => {
		ddbClientMock.send.mockResolvedValueOnce(someItem);
		const getResult = await getAppEntry(
			{
				queryStringParameters: {
					id: "123",
				},
			} as any,
			ddbClientMock as any
		);
		await new Promise(process.nextTick);
		const expectedResult = {
			statusCode: 200,
			body: JSON.stringify({
				id: "123",
				location: "Paris",
			}),
		};
		expect(getResult).toEqual(expectedResult);
		expect(ddbClientMock.send).toBeCalledWith(expect.any(GetItemCommand));
		const getItemCommandInput = (
			ddbClientMock.send.mock.calls[0][0] as GetItemCommand
		).input;
		expect(getItemCommandInput.TableName).toBeUndefined();
		expect(getItemCommandInput.Key).toEqual({
			id: {
				S: "123",
			},
		});
	});
});
