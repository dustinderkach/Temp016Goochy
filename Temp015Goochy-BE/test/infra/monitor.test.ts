import { App } from "aws-cdk-lib";
import { Temp015GoochyMonitorStack } from "../../src/infra/stacks/Temp015GoochyMonitorStack";
import { Capture, Match, Template } from "aws-cdk-lib/assertions";

describe("Initial test suite", () => {
	let temp015GoochyMonitorStackTemplate: Template;

	beforeAll(() => {
		const testApp = new App({
			outdir: "cdk.out",
		});

		const temp015GoochyMonitorStack = new Temp015GoochyMonitorStack(
			testApp,
			"Temp015GoochyMonitorStack"
		);
		temp015GoochyMonitorStackTemplate = Template.fromStack(
			temp015GoochyMonitorStack
		);
	});

	test("initial test", () => {
		temp015GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::Lambda::Function",
			{
				Handler: "index.handler",
				Runtime: "nodejs18.x",
			}
		);
	});

	test("Sns topic properties", () => {
		temp015GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Topic",
			{
				DisplayName: "Temp015GoochyAlarmTopic",
				TopicName: "Temp015GoochyAlarmTopic",
			}
		);
	});

	test("Sns subscription properties - with matchers", () => {
		temp015GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Subscription",
			Match.objectEquals({
				Protocol: "lambda",
				TopicArn: {
					Ref: Match.stringLikeRegexp("Temp015GoochyAlarmTopic"),
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
			temp015GoochyMonitorStackTemplate.findResources("AWS::SNS::Topic");
		const snsTopicName = Object.keys(snsTopic)[0];

		const lambda = temp015GoochyMonitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);
		const lambdaName = Object.keys(lambda)[0];

		temp015GoochyMonitorStackTemplate.hasResourceProperties(
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

	test("Temp015GoochyAlarm actions", () => {
		const temp015GoochyAlarmTopicActionsCapture = new Capture();

		temp015GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::CloudWatch::Alarm",
			{
				AlarmActions: temp015GoochyAlarmTopicActionsCapture,
			}
		);

		expect(temp015GoochyAlarmTopicActionsCapture.asArray()).toEqual([
			{
				Ref: expect.stringMatching(/^Temp015GoochyAlarmTopic/),
			},
		]);
	});

	test("Monitor stack snapshot", () => {
		expect(temp015GoochyMonitorStackTemplate.toJSON()).toMatchSnapshot();
	});

	test("Lambda stack snapshot", () => {
		const lambda = temp015GoochyMonitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);

		expect(lambda).toMatchSnapshot();
	});
	test("SnsTopic stack snapshot", () => {
		const snsTopic =
			temp015GoochyMonitorStackTemplate.findResources("AWS::SNS::Topic");

		expect(snsTopic).toMatchSnapshot();
	});
});
