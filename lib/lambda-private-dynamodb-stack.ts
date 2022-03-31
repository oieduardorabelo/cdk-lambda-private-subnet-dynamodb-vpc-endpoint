import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class LambdaPrivateDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    let vpc = new cdk.aws_ec2.Vpc(this, "Vpc", {
      cidr: "10.0.0.0/16",
      natGateways: 0,
      maxAzs: 1,
      subnetConfiguration: [
        {
          name: "isolated",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    let dynamoDbEndpoint = vpc.addGatewayEndpoint("DynamoDbEndpoint", {
      service: cdk.aws_ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    let tableUsers = new cdk.aws_dynamodb.Table(this, "Users", {
      partitionKey: { name: "id", type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    let handler = new cdk.aws_lambda_nodejs.NodejsFunction(this, "ApiLambda", {
      entry: "./lib/functions/main.ts",
      vpc,
      environment: {
        TABLE_USERS: tableUsers.tableName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
      vpcSubnets: {
        subnets: vpc.isolatedSubnets,
      },
    });
    tableUsers.grantFullAccess(handler);

    let api = new cdk.aws_apigateway.LambdaRestApi(this, "ApiGateway", {
      handler,
    });
  }
}
