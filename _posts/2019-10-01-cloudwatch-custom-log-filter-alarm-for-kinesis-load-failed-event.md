---
title: CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event
date: 2019-10-01 11:00:00 +0530
description: Setup the cloudwatch custom log filter for sending email alert for kinesis
  firehose load failed event for RedShift
categories:
- AWS
tags:
- aws
- kinesis
- cloudwatch
- monitoring
- redshift
image: "/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event.jpeg"

---
Kinesis Firehose is pushing the realtime data to S3, Redshift, ElasticSearch, and Splunk for realtime/Near real-time analytics. Sometime the target may not available due to maintenance or any reason. So the Kinesis will automatically push the data to S3 and create the manifest file in the `errors` directory. Then later we can reload the data into our targets. But unfortunately, there is no one-step action to set notification if the load is failed. In this blog, im writing how can we setup Cloudwatch custom log filter alarm for kinesis load failed events. 

## Kinesis Firehose Setup: 

Im sending my clickstream data to Kinesis Firehose and then there is an intermediate S3 bucket to store the data in `JSON` format with `GZIP` compression. And then the data will go to RedShift for further analytics purpose. 

## RedShift Failures in Kinesis: 

Kinesis will not send the data to Redshift in many cases. Here are some most common errors.

1. Redshift.AuthenticationFailed
2. Redshift.ConnectionFailed	
3. Redshift.ReadOnlyCluster	
4. Redshift.DiskFull

There are many other errors you can refer to the below Reference section to read more about the types of errors. 

## Customer Log Filter in CloudWatch: 

To setup the email notification, we need to filter the Cloudwatch logs with the keyword `errorCode` and `RedShift`. 

* Go to Cloudwatch -->  Logs
* Click the radio button on `/aws/kinesisfirehose/your-stream-name`
* Create Metric Filter.
* Filter Pattern: `[w1!=errorCode&&w1!=Redshift] `( _This means the string errorCode and RedShift will be on the same line_).
* Select Log Data to Test: RedShiftDelivery
* Test pattern. (it'll give you some X number of matching lines)

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event1.jpg)

Now assign the metric.

* Filter Name: kinesis-redshift-error
* Filter Pattern: it'll automatically select the pattern which we used in the previous step. 
* Metic Name: redshift-kinesis-error
* Metic Value: 1
* Click on the save filter.

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event2.jpg)

## Create the Alarm: 

Once the clicked the Save Filter option you can see the window. Or you go to Cloudwatch --> logs --> /aws/kinesisfirehose/your-stream-name on  Metric Filters column you can see 1 filter.

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event4.jpg)

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event3.jpg)

1. Click on the Create Alarm link.
2. Under the metric option:  select the period as 10 seconds. 
3. Conditions: Threshold type --> Static
4. Define the alarm condition --> Greater/Equal
5. Define the threshold value --> 1
6. Under the Additional Configuration: Datapoints to alarm `1 out of 1`
7. Missing data treatment: Treat Missing Data as Good.
8. Rest of the things are easy, you can select an SNS topic for sending an email alert. 

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event5.jpg)

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event8.jpg)

### Why Treat Missing Data as Good?

In the Cloudwatch, we'll not get any logs unless kinesis gets some errors. So it'll not get any values for the metric. Then your alarm will go to insufficient state. We are interested in only getting email alerts. So if my CloudWatch didn't get any errors then this Alarm will go to OK state. 

## Test this Alarm: 

For testing purpose, I changed my redshift password in Kinesis Firehose. Then I got this error from the Cloudwatch.

**CloudWatch Log:**

    {
        "deliveryStreamARN": "arn:aws:firehose:ap-south-1:XXXXXXXX/Kinesis-test-stream",
        "destination": "jdbc:redshift://XXXXXXXXXX.redshift.amazonaws.com:5439/test",
        "deliveryStreamVersionId": 11,
        "message": "The provided user name and password failed authentication. Provide valid user name and password.",
        "errorCode": "Redshift.AuthenticationFailed"
    }

**CloudWatch Alarm:**

You can see a blue line or a blue dot which indicates that the pattern matched.

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event6.jpg)

**Email:**

Yes, and I got the email from SNS topic. 

![](/assets/CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event7.jpg)

## Further References: 

1. [Learn more about all error events in Kinesis Firehose](https://docs.aws.amazon.com/firehose/latest/dev/monitoring-with-cloudwatch-logs.html)
2. [Using AWS CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
3. [CloudWatch Filter and Patten matching syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html)
4. [Other Cloudwatch metrics for Kinesis Firehose](https://docs.aws.amazon.com/firehose/latest/dev/monitoring-with-cloudwatch-metrics.html)