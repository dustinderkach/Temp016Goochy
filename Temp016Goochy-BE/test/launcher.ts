//THIS IS A TEST FILE FOR THE APP HANDLER

import { handlerApp } from "../src/services/appThing/handlerTemp016Goochy";

process.env.AWS_REGION = "us-east-1";
process.env.TABLE_NAME = "Temp016GoochyTable";

handlerApp(
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
