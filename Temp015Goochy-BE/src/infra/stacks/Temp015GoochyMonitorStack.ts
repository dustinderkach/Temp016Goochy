import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { join } from "path";

export class Temp015GoochyMonitorStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const webHookLambda = new NodejsFunction(this, "webHookLambda", {
			runtime: Runtime.NODEJS_18_X,
			handler: "handlerMonitor",
			entry: join(
				__dirname,
				"..",
				"..",
				"services",
				"monitor",
				"handlerMonitor.ts"
			),
		});

		const temp015GoochyAlarmTopic = new Topic(this, "Temp015GoochyAlarmTopic", {
			displayName: "Temp015GoochyAlarmTopic",
			topicName: "Temp015GoochyAlarmTopic",
		});

		//trigger the lambda function when the alarm is triggered
		temp015GoochyAlarmTopic.addSubscription(new LambdaSubscription(webHookLambda));

		const temp015GoochyApi4xxAlarm = new Alarm(this, "temp015GoochyApi4xxAlarm", {
			metric: new Metric({
				metricName: "4XXError",
				namespace: "AWS/ApiGateway",
				period: Duration.minutes(1),
				statistic: "Sum",
				unit: Unit.COUNT,
				dimensionsMap: {
					ApiName: "Temp015GoochyApi",
				},
			}),
			evaluationPeriods: 1,
			threshold: 5,
			alarmName: "Temp015GoochyApi4xxAlarm",
		});
		const topicAction = new SnsAction(temp015GoochyAlarmTopic);
		temp015GoochyApi4xxAlarm.addAlarmAction(topicAction);
		temp015GoochyApi4xxAlarm.addOkAction(topicAction);
	}
}
