import { App } from "aws-cdk-lib";
import { Temp016GoochyMonitorStack } from "../../src/infra/stacks/Temp016GoochyMonitorStack";
import { Capture, Match, Template } from "aws-cdk-lib/assertions";

describe("Initial test suite", () => {
	let temp016GoochyMonitorStackTemplate: Template;

	beforeAll(() => {
		const testApp = new App({
			outdir: "cdk.out",
		});

		const temp016GoochyMonitorStack = new Temp016GoochyMonitorStack(
			testApp,
			"Temp016GoochyMonitorStack"
		);
		temp016GoochyMonitorStackTemplate = Template.fromStack(
			temp016GoochyMonitorStack
		);
	});

	test("initial test", () => {
		temp016GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::Lambda::Function",
			{
				Handler: "index.handler",
				Runtime: "nodejs18.x",
			}
		);
	});

	test("Sns topic properties", () => {
		temp016GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Topic",
			{
				DisplayName: "Temp016GoochyAlarmTopic",
				TopicName: "Temp016GoochyAlarmTopic",
			}
		);
	});

	test("Sns subscription properties - with matchers", () => {
		temp016GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Subscription",
			Match.objectEquals({
				Protocol: "lambda",
				TopicArn: {
					Ref: Match.stringLikeRegexp("Temp016GoochyAlarmTopic"),
				},
				Endpoint: {
					"Fn::GetAtt": [
						Match.stringLikeRegexp("webHookLambda"),
						"Arn",
					],
				},
			})
		);
	});

	test("Sns subscription properties - with exact values", () => {
		const snsTopic =
			temp016GoochyMonitorStackTemplate.findResources("AWS::SNS::Topic");
		const snsTopicName = Object.keys(snsTopic)[0];

		const lambda = temp016GoochyMonitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);
		const lambdaName = Object.keys(lambda)[0];

		temp016GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Subscription",
			{
				Protocol: "lambda",
				TopicArn: {
					Ref: snsTopicName,
				},
				Endpoint: {
					"Fn::GetAtt": [lambdaName, "Arn"],
				},
			}
		);
	});

	test("Temp016GoochyAlarm actions", () => {
		const temp016GoochyAlarmTopicActionsCapture = new Capture();

		temp016GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::CloudWatch::Alarm",
			{
				AlarmActions: temp016GoochyAlarmTopicActionsCapture,
			}
		);

		expect(temp016GoochyAlarmTopicActionsCapture.asArray()).toEqual([
			{
				Ref: expect.stringMatching(/^Temp016GoochyAlarmTopic/),
			},
		]);
	});

	test("Monitor stack snapshot", () => {
		expect(temp016GoochyMonitorStackTemplate.toJSON()).toMatchSnapshot();
	});

	test("Lambda stack snapshot", () => {
		const lambda = temp016GoochyMonitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);

		expect(lambda).toMatchSnapshot();
	});
	test("SnsTopic stack snapshot", () => {
		const snsTopic =
			temp016GoochyMonitorStackTemplate.findResources("AWS::SNS::Topic");

		expect(snsTopic).toMatchSnapshot();
	});
});
