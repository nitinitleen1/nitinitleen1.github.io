---
layout: post
title: Create Aurora Read Replica With AWS CLI/Lambda Python
date: 2019-01-25 19:09:11.000000000 +00:00
description: This blog will help you to automate Create Aurora Read Replica With AWS CLI/Lambda Python. You can use this for a scaleable solution.

categories:
- AWS

tags:
- aurora
- aws
- cli
- lamba
- mysql
- python
- rds
---
![Create Aurora Read Replica With AWS CLI-Lambda Python](https://thedataguy.in/assets/Create-Aurora-Read-Replica-With-AWS-CLI-Lambda-Python.jpg "Create Aurora Read Replica With AWS CLI-Lambda Python")  

Today I was working for a scaleable solution in Aurora. Im going to publish that blog post soon in [Searce](https://medium.com/searce) Blog. As a part of this solution, I want to create Aurora read replicas programmatically. So we have done the create aurora read replica with AWS CLI and Lambda with Python. If you refer the AWS Doc, they mentioned there is no separate module for creating Aurora Read replica in boto3 or cli. Instead we can use [_create-db-instance_](https://docs.aws.amazon.com/cli/latest/reference/rds/create-db-instance.html). Many people may confused with this term. This blog will help them to create aurora read replicas using AWS CLI and Lambda.

## Required Permission:

If you are running this code via lambda then you can use the below policy.

*   Lambda - Create a new role for lambda and attach inline policy
*   EC2 Role - Create a new EC2 role and attach this policy and attach this Role to EC2.
*   IAM User - If you are manually use IAM credentials for AWS CLI, attach the below policy to the IAM user.

{% highlight json %}
    
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": [
                    "rds:CreateDBCluster",
                    "rds:CreateDBInstance"
                ],
                "Resource": "*"
            }
        ]
    }
{% endhighlight %}

## Create Your Aurora Cluster:

First we need to create an Aurora cluster with 1 node. There are so many references for this. :) I leave this part to you.

### Aurora Details:

*   Cluster Name: bhuvi-aurora-replica-cluster
*   Engine: aurora-mysql
*   Engine Version: 5.7.12
*   DB Parameter Group: default.aurora-mysql5.7
*   Publicly accessible: Yes
*   Storage Encrypt: No

## AWS CLI Command:

{% highlight shell %}

    aws rds create-db-instance --db-instance-identifier bhuvi-aurora-cli \
     --db-instance-class db.t2.small \
      --engine aurora-mysql \
      --availability-zone us-east-1b \
      --db-parameter-group-name default.aurora-mysql5.7 \
      --publicly-accessible \
      --no-storage-encrypted \
      --db-cluster-identifier bhuvi-aurora-replica-cluster  \
      --promotion-tier 15
{% endhighlight %}


## Lambda Code in Python:
{% highlight python %}

    import time
    import boto3
    import botocore

    def lambda_handler(event, context):
         rds = boto3.client('rds')

         rds.create_db_instance(
            DBParameterGroupName='default.aurora-mysql5.7',
          Engine='aurora-mysql',
          EngineVersion='5.7.12',
          DBClusterIdentifier='bhuvi-aurora-replica-cluster',
          AvailabilityZone='us-east-1b',
          DBInstanceClass='db.t2.small',
          DBInstanceIdentifier='bhuvi-aurora-lambda1',
          PubliclyAccessible=True,
          StorageEncrypted=False,
          PromotionTier=15)
{% endhighlight %}

