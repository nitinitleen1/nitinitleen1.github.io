---
layout: post
title: Automate AWS Athena Create Partition On Daily Basis
date: 2018-05-30 08:40:37.000000000 +00:00
description: In my previous blog post I have explained how to automatically create AWS Athena Partitions for cloudtrail logs between two dates. This post will help you to automate AWS Athena create partition on daily basis for cloudtrail logs.
categories:
- AWS
tags:
- athena
- automation
- aws
- cloudtrail
- python

---
![Automate AWS Athena Create Partition On Daily Basis]({{ site.baseurl }}/assets/Automate-AWS-Athena-Create-Partition-On-Daily-Basis.png)

In my previous blog post I have explained how to automatically create AWS Athena Partitions for cloudtrail logs between two dates. That script will help us to create the partitions till today. But cloudtrail will generate log on everyday. So I was thinking to automate this process too. For this automation I have used Lambda which is a serverless one. This will automate AWS Athena create partition on daily basis. Your Lambda function needs Read permisson on the cloudtrail logs bucket, write access on the query results bucket and execution permission for Athena.

**Here is my AWS CloudTrail Log path in S3.**

{% highlight shell %}
s3://bucket/AWSLogs/Account_ID/Cloudtrail/regions/year/month/day/log_files
{% endhighlight %}

Create the table with Partitions
--------------------------------
{% highlight sql %}

CREATE EXTERNAL TABLE cloudtrail_log (
eventversion STRING,
useridentity STRUCT<
               type:STRING,
               principalid:STRING,
               arn:STRING,
               accountid:STRING,
               invokedby:STRING,
               accesskeyid:STRING,
               userName:STRING,
sessioncontext:STRUCT<
attributes:STRUCT<
               mfaauthenticated:STRING,
               creationdate:STRING>,
sessionissuer:STRUCT<
               type:STRING,
               principalId:STRING,
               arn:STRING,
               accountId:STRING,
               userName:STRING>>>,
eventtime STRING,
eventsource STRING,
eventname STRING,
awsregion STRING,
sourceipaddress STRING,
useragent STRING,
errorcode STRING,
errormessage STRING,
requestparameters STRING,
responseelements STRING,
additionaleventdata STRING,
requestid STRING,
eventid STRING,
resources ARRAY<STRUCT<
               ARN:STRING,
               accountId:STRING,
               type:STRING>>,
eventtype STRING,
apiversion STRING,
readonly STRING,
recipientaccountid STRING,
serviceeventdetails STRING,
sharedeventid STRING,
vpcendpointid STRING
)
PARTITIONED BY(region string,year string, month string, day string)
ROW FORMAT SERDE 'com.amazon.emr.hive.serde.CloudTrailSerde'
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://sqladmin-cloudtrail/AWSLogs/XXXXXXXXXX/CloudTrail/';
{% endhighlight %}


IAM Policy for the Lambda
-------------------------
{% highlight sql %}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": [
                "arn:aws:s3:::aws-athena-query-results-XXXXXXXXXX-us-east-1",
                "arn:aws:s3:::sqladmin-cloudtrail"
            ]
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::aws-athena-query-results-XXXXXXXXXXXXXXXX-us-east-1/*"
        },
        {
            "Sid": "VisualEditor2",
            "Effect": "Allow",
            "Action": [
                "s3:GetObjectAcl",
                "s3:GetObject",
                "s3:GetObjectTagging",
                "s3:GetBucketPolicy"
            ],
            "Resource": [
                "arn:aws:s3:::sqladmin-cloudtrail",
                "arn:aws:s3:::sqladmin-cloudtrail/*"
            ]
        },
        {
            "Sid": "VisualEditor3",
            "Effect": "Allow",
            "Action": [
                "athena:StartQueryExecution",
                "athena:CreateNamedQuery",
                "athena:RunQuery"
            ],
            "Resource": "*"
        }
    ]
}
{% endhighlight %}


Parameters for S3 bucket and Athena
-----------------------------------

1.  **s3_buckcet** -- Bucket name where your cloudtrail logs stored.
2.  **s3_prefix** -- Path for your cloudtrail logs (give the prefix before the regions. For eg: `s3://bucket/AWSLogs/AccountID/Cloudtrail/regions/year/month/day/log_files`. So you need to use path: `AWSLogs/AccountID/Cloudtrail/` ).
3.  **s3_ouput** -- Path for where your Athena query results need to be saved.
4.  **database** -- Name of the DB where your cloudwatch logs table located.
5.  **table_name** -- Nanme of the table where your cloudwatch logs table located.

Main Function for create the Athena Partition on daily
------------------------------------------------------

> NOTE: I have created this script to add partition as current date +1(means tomorrow's date). Because its always better to have one day additional partition, so we don't need wait until the lambda will trigger for that particular date.

Before schedule it, you need to create partition for till today. Refer [﻿this link﻿](https://thedataguy.in/automatically-create-aws-athena-partitions-for-cloudtrail-between-two-dates/) will help you to create partitions between any particular date.

{% highlight python %}
#Import libraries
import boto3
import datetime

#Connection for S3 and Athena
s3 = boto3.client('s3')
athena = boto3.client('athena')

#Get Year, Month, Day for partition (this will get tomorrow date's value)
date = datetime.datetime.now()
athena_year = str(date.year)
athena_month = str(date.month).rjust(2, '0')
athena_day = str(date.day + 1).rjust(2, '0')

#Parameters for S3 log location and Athena table
#Fill this carefully (Read the commented section on top to help)
s3_buckcet = 'sqladmin-cloudtrail'
s3_prefix = 'AWSLogs/XXXXXXXXXXXX/CloudTrail/'
s3_input = 's3://' + s3_buckcet + '/' + s3_prefix
s3_ouput = 's3://aws-athena-query-results-XXXXXXXXXXXXXX-us-east-1'
database = 'athena_log_database'
table_name = 'cloudtrail_logs_table'

#Executing the athena query:
def run_query(query, database, s3_output):
        query_response = athena.start_query_execution(
        QueryString=query,
        QueryExecutionContext={
            'Database': database
            },
        ResultConfiguration={
            'OutputLocation': s3_output,
            }
        )
        print('Execution ID: ' + query_response['QueryExecutionId'])
        return query_response

#Main function for get regions and run the query on the captured regions
def lambda_handler(event, context):
 result =  s3.list_objects(Bucket=s3_buckcet,Prefix=s3_prefix, Delimiter='/')
 for regions in result.get('CommonPrefixes'):
    get_region=(regions.get('Prefix','').replace(s3_prefix,'').replace('/',''))
    query = str("ALTER TABLE "+ table_name +" ADD PARTITION (region='"
            + get_region + "',year="
            + athena_year + ",month="
            + athena_month + ",day="
            + athena_day
            + ") location '"+s3_input
            + get_region
            + "/" + athena_year + "/" + athena_month + "/"
            + athena_day + "';")
      #print(get_region) -- for debug
      #print(query) -- for debug
run_query(query, database, s3_ouput)
{% endhighlight %}

