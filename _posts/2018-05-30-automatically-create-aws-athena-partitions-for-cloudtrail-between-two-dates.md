---
layout: post
title: AWS Athena Automatically Create Partition For Between Two Dates
date: 2018-05-30 10:14:16.000000000 +00:00
description: Athena is one of best services in AWS to build a Data Lake solutions and do analytics on flat files which are stored in the S3. In the backend its actually using presto clusters. Here Im gonna explain automatically create AWS Athena partitions for cloudtrail between two dates.
categories:
- AWS
tags:
- athena
- automation
- aws
- lamba
- python

---
![AWS Athena Automatically Create Partition For Between Two Dates]({{ site.baseurl }}/assets/AWS-Athena-Automatically-Create-Partition-For-Between-Two-Dates.jpg)

AWS Athena is a schema on read platform. Now Athena is one of best services in AWS to build a Data Lake solutions and do analytics on flat files which are stored in the S3. In the backend its actually using presto clusters. So most of the Presto functions are support and you can use native SQL query to query your data. You can create partitions to speedup your query and reduce the cost for scanning. Here Im gonna explain automatically create AWS Athena partitions for cloudtrail between two dates. When it is introduced I used this for analyze CloudTrail Logs which was very helpful to get some particular activities like who launched this instance, track a particular user's activity and etc.

But the challenge was I had 3 years of CloudTrail log. It was really a huge data. So If I query to find when an instance is launched then it'll start scanning the complete data and it took more time and added additional cost for me. Also I used around 8 regions.

**Here is my AWS CloudTrail Log path in S3.**
{% highlight shell %}
s3://bucket/AWSLogs/Account_ID/Cloudtrail/regions/year/month/day/log_files
{% endhighlight %}


So I need to create partitions from `regions/year/month/day/`
Execute create partition  query for 3 years is not an easy job. Also I  need to run the partition query on 8 regions for 3 years. Uuuuuhhhhh!! It doesn't make sense. So I have created a Lambda function to make my job easier.  

![Automatically Create AWS Athena Partitions]({{ site.baseurl }}/assets/Automatically-Create-AWS-Athena-Partitions.jpg)

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

Create the Lambda function
--------------------------

Go to Lambda and create a new function with Python 3.6.

### IAM role for Lambda:

-   S3 -- ListBukcet.
-   S3 -- Read Object on the Cloudtrail log bucket (My bucket Name: sqladmin-cloudtraillog).
-   S3 -- Write Object on the athena results bucket (My results bucket: aws-athena-query-results-XXXXXXXXXXXXXXXX-us-east-1).
-   Athena -- Create Names query and Execution.

{% highlight json %}

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


NOTE

AWS Lambda can run upto 5mins only. So if you want to create partitions for more than 3 months then give the start_date and end_date only for 3 months per execution. OR run this on a server.

**#update:** Now lambda supports 15mins execution

Parameters for S3 bucket and Athena

-------------------------------------

-   *​s3_bucket* -- Bucket name where your cloudtrail logs stored.
-   *s3_prefix* -- Path for your cloudtrail logs (give the prefix before the regions. For eg: `s3://bucket/AWSLogs/AccountID/Cloudtrail/regions/year/month/day/log_files`. So you need to use path: `AWSLogs/AccountID/Cloudtrail/` ).
-   *s3_ouput* -- Path for where your Athena query results need to be saved.
-   *database* -- Name of the DB where your cloudwatch logs table located.
-   *table_name* -- Nanme of the table where your cloudwatch logs table located.
-   *start_date* -- Start date for creating partition.
-   *end_date* -- Last date for creating partition.

Function for get range from given two dates
-------------------------------------------

{% highlight python %}

def daterange(start_date, end_date):
    for n in range(int ((end_date - start_date).days)):
yield start_date + timedelta(n)
{% endhighlight %}


Function for execute the Athena Query
-------------------------------------

{% highlight python %}
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
{% endhighlight %}


Main Function to Automatically create AWS Athena partitions
-----------------------------------------------------------

> Athena support **20 concurrent** executions only. We need control the Lambda/Python to wait for sometime before execute the next loop. So I have given **2 secs** before execute the next loop.

{% highlight python %}
def lambda_handler(event, context):
 result =  s3.list_objects(Bucket=s3_buckcet,Prefix=s3_prefix, Delimiter='/')
 for regions in result.get('CommonPrefixes'):
             get_region=(regions.get('Prefix','').replace(s3_prefix,'').replace('/',''))
             for single_date in daterange(start_date, end_date):
                 partition_day = str(single_date.day).rjust(2, '0')
                 partition_month = str(single_date.month).rjust(2, '0')
                 partition_year = str(single_date.year).rjust(2, '0')
                 print(partition_day, partition_month, partition_year)
                 query = str("ALTER TABLE "+ table_name +" ADD PARTITION (region='"
                 + get_region + "',year="
                 + partition_year + ",month="
                 + partition_month + ",day="
                 + partition_day
                 + ") location '"+s3_input
                 + get_region
                 + "/" + partition_year + "/" + partition_month + "/"
                 + partition_day + "';")
                 #print(get_region)
                 #print(query)
                 run_query(query, database, s3_ouput)
time.sleep(2)
{% endhighlight %}


Find the final Code
-------------------
{% highlight python %}

# Lambda function to create partition for Cloudtrail log on daily basis.
# You need to schedule it in AWS Lambda.

'''
-------------------------------------------
AWS Athena Create Partitions Automatically
-------------------------------------------
Version 1.0
Author: BhuviTheDataGuy
Twitter: https://twitter.com/BhuviTheDataGuy
License: Free for educational purpose.                 
NOTE: 
-----
1) Before schedule it, you need to create partitions for till current date.
2) This is will start creating partitions with next day [current date +1].
3) This will not return the Athena query is successful or not. But this
   will return the Query Execution ID. 
HOW THIS WORKS:
---------------
1) It'll check the list of regions that cloudwatch logs captured from the 
   S3. Becuase few peoples will use only particular region. So they won't
   get any logs on other regions. 
2) Then it'll start executing the create partition queries against all 
   the regions. 
Example Cloudtrail Path:
-----------------------
s3://bucket/AWSLogs/Account_ID/Cloudtrail/regions/year/month/day/log_files
PARAMETERS NEEDS TO CHANGE:
---------------------------
1) s3_buckcet - Bucket name where your cloudtrail logs stored.
2) s3_prefix - Path for your cloudtrail logs (give the prefix before the regions. 
   for eg: s3://bucket/AWSLogs/AccountID/Cloudtrail/regions/year/month/day/log_files
   So you need to use path: AWSLogs/AccountID/Cloudtrail/ )
3) s3_ouput - Path for where your Athena query results need to be saved.
4) database - Name of the DB where your Cloudtrail logs table located.
5) table_name - Nanme of the table where your Cloudtrail logs table located.
DEBUGGING:
----------
1) comment the line 103 [run_query(query, database, s3_ouput]
2) remove comment from line 101 and 102 [print(get-regions), print(query)]
---------------------------------------------------------------------------------'''

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
s3_buckcet = 'cloudtrail-logs'
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
