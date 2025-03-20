#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsomeTankShooterStack } from './awsome-tank-shooter-stack';

const app = new cdk.App();
new AwsomeTankShooterStack(app, 'AwsomeTankShooterStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
}); 