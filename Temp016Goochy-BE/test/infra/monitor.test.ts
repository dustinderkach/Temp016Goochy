import { App } from "aws-cdk-lib";
import { AppMonitorStack } from "../../src/infra/stacks/MonitorStack";
import { Capture, Match, Template } from "aws-cdk-lib/assertions";
import test, { describe } from "node:test";

describe("Initial test suite", () => {
	let monitorStackTemplate: Template;

	beforeAll(() => {
		const testApp = new App({
			outdir: "cdk.out",
		});

		const testMonitorStack = new AppMonitorStack(
			testApp,
			"TestMonitorStack"
		);
		monitorStackTemplate = Template.fromStack(testMonitorStack);
	});

	test("initial test", () => {
		monitorStackTemplate.hasResourceProperties("AWS::Lambda::Function", {
			Handler: "index.handler",
			Runtime: "nodejs18.x",
		});
	});

	test("Sns topic properties", () => {
		monitorStackTemplate.hasResourceProperties("AWS::SNS::Topic", {
			DisplayName: "Temp016GoochyAlarmTopic",
			TopicName: "Temp016GoochyAlarmTopic",
		});
	});

	test("Sns subscription properties - with matchers", () => {
		monitorStackTemplate.hasResourceProperties(
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
		const snsTopic = monitorStackTemplate.findResources("AWS::SNS::Topic");
		const snsTopicName = Object.keys(snsTopic)[0];

		const lambda = monitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);
		const lambdaName = Object.keys(lambda)[0];

		monitorStackTemplate.hasResourceProperties("AWS::SNS::Subscription", {
			Protocol: "lambda",
			TopicArn: {
				Ref: snsTopicName,
			},
			Endpoint: {
				"Fn::GetAtt": [lambdaName, "Arn"],
			},
		});
	});

	test("Temp016GoochyAlarm actions", () => {
		const temp016GoochyAlarmTopicActionsCapture = new Capture();

		monitorStackTemplate.hasResourceProperties("AWS::CloudWatch::Alarm", {
			AlarmActions: temp016GoochyAlarmTopicActionsCapture,
		});

		expect(temp016GoochyAlarmTopicActionsCapture.asArray()).toEqual([
			{
				Ref: expect.stringMatching(/^Temp016GoochyAlarmTopic/),
			},
		]);
	});

	test("Monitor stack snapshot", () => {
		expect(monitorStackTemplate.toJSON()).toMatchSnapshot();
	});

	test("Lambda stack snapshot", () => {
		const lambda = monitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);

		expect(lambda).toMatchSnapshot();
	});
	test("SnsTopic stack snapshot", () => {
		const snsTopic = monitorStackTemplate.findResources("AWS::SNS::Topic");

		expect(snsTopic).toMatchSnapshot();
	});
});
