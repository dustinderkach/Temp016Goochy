
//THIS IS A TEST FILE FOR THE Temp015Goochy HANDLER

import { handlerTemp015Goochy } from "../src/services/temp015Goochy/handlerTemp015Goochy";

process.env.AWS_REGION = "us-east-1";
process.env.TABLE_NAME = "Temp015GoochyTable";

handlerTemp015Goochy(
	{
		httpMethod: "PUT",
		queryStringParameters: {
			id: "fbe76aea-5aff-434e-85f6-e8f5fc1647ec",
		},
		body: JSON.stringify({
			location: "Best location 2",
		}),
	} as any,
	{} as any
).then((result) => {
	console.log(result);
});
