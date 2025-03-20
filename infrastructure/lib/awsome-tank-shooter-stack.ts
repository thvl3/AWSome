import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AwsomeTankShooterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'GameVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'GameCluster', {
      vpc,
      containerInsights: true,
    });

    // Create DynamoDB table for scores
    const scoresTable = new dynamodb.Table(this, 'ScoresTable', {
      partitionKey: { name: 'playerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      pointInTimeRecovery: true,
    });

    // Create S3 bucket for frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      autoDeleteObjects: true, // For development only
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'GameApi', {
      restApiName: 'Tank Shooter API',
      description: 'API for the Tank Shooter game',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    // Create WebSocket API
    const wsApi = new apigateway.WebSocketApi(this, 'GameWebSocketApi', {
      connectRouteOptions: { integration: apigateway.WebSocketIntegrationType.NONE },
      disconnectRouteOptions: { integration: apigateway.WebSocketIntegrationType.NONE },
      defaultRouteOptions: { integration: apigateway.WebSocketIntegrationType.NONE },
    });

    // Create WebSocket Stage
    const wsStage = new apigateway.WebSocketStage(this, 'GameWebSocketStage', {
      webSocketApi: wsApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Create Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'GameService', {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../backend'),
        containerPort: 3000,
        environment: {
          DYNAMODB_TABLE: scoresTable.tableName,
          NODE_ENV: 'production',
        },
      },
    });

    // Grant DynamoDB permissions to the Fargate task
    scoresTable.grantReadWriteData(fargateService.taskDefinition.taskRole);

    // Add WebSocket route to Fargate service
    wsApi.addRoute('$connect', {
      integration: new apigateway.WebSocketNlbIntegration({
        vpcLink: fargateService.loadBalancer,
        securityGroup: fargateService.service.connections.securityGroups[0],
      }),
    });

    wsApi.addRoute('$disconnect', {
      integration: new apigateway.WebSocketNlbIntegration({
        vpcLink: fargateService.loadBalancer,
        securityGroup: fargateService.service.connections.securityGroups[0],
      }),
    });

    wsApi.addRoute('$default', {
      integration: new apigateway.WebSocketNlbIntegration({
        vpcLink: fargateService.loadBalancer,
        securityGroup: fargateService.service.connections.securityGroups[0],
      }),
    });

    // Output the WebSocket URL
    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: wsStage.url,
      description: 'WebSocket API URL',
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: distribution.distributionDomainName,
      description: 'Frontend URL',
    });
  }
} 