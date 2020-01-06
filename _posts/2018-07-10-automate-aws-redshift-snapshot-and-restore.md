---
layout: post
title: Automate AWS RedShift Snapshot And Restore
date: 2018-07-10 11:56:20.000000000 +00:00
description: Automate AWS Redshift snapshot and restore using shell script and aws cli. We can schedule this process on daily basis.

categories:
- AWS
tags:
- automation
- aws
- redshift
- scripting
- shell

---
![Automate AWS RedShift Snapshot And Restore]({{ site.baseurl }}/assets/Automate-AWS-RedShift-Snapshot-And-Restore.jpg)

Redshift will help to handle a massive data warehouse workload. I used to manage some redshift cluster in past. Whenever the developers or I wanted to test something on RedShift, we generally take a snapshot and then launch a new cluster or launch it from the automated snapshot. This is fine for Ad-Hoc workloads. Think something like, if your developers want to continually test and run their sample queries on the cluster on daily basis with updated data then there will be a headache for AWS Admins, So I have prepared a shell script for this to mate this process and it'll send the email alerts when any one of the steps are failed. This script will help you to automate AWS Redshift snapshot and restore. 

How this works?
---------------

I create this shell script which will work using AWS CLI.  The flow of this process is,

-   Remove old Dev/Test Cluster (which was created yesterday).
-   Take a snapshot of current Prod Cluster .
-   Wait for Snapshot complete .
-   Launch a new cluster from the snapshot.
-   wait for the creation complete. 
-   Delete older than one day snapshot which is created by this script.

Pre-Requirements:
-----------------

### Create an IAM user with Access and Secret keys then attach the below policy.

{% highlight json %}
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "redshift:CreateClusterSnapshot",
                "redshift:DeleteClusterSnapshot",
                "redshift:DescribeClusterSnapshots",
                "redshift:CreateCluster",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
{% endhighlight %}

### Install AWS CLI.
Follow [this AWS documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) for configuring aws cli.

Before running the script:
--------------------------

Please change the necessary values which are mentioned below.

| YOUR_ACCESS_KEY | IAM user's Access Key |
| YOUR_SECRET_KEY | IAM user's Secret Key   |
| prod-cluster | Prod/Main cluster name |
| dev-cluster | New Test/DEV cluster name |
| REDSHIFT-REGION | Region where your cluster located |
| ses-region | Region for your SES |
| from@domain.com | From Address for SES (this should be verified one) |
| to@domain.com,to2@domain.com | Who all are needs to get the email notification |
| default.redshift-1.0 | If you are using custom parameter group then replace this with that name. |
| "sg-id1" "sg-id2" | Security group ids that you want to attach it to Redshift Cluster. |

Parameters
----------
{% highlight shell %}

Snapdate=`date +%Y-%m-%d-%H-%M-%S`
SourceRedshift='prod-cluster'
DestRedshift='dev-cluster'
Region='REDSHIFT-REGION'
{% endhighlight %}

Drop old TEST/DEV Cluster:
--------------------------

{% highlight shell %}

aws redshift  delete-cluster\
--region $Region\
--cluster-identifier  $DestRedshift\
--skip-final-cluster-snapshot
{% endhighlight %}

Initiate the Snapshot of PROD/MAIN cluster
------------------------------------------

{% highlight shell %}

aws redshift create-cluster-snapshot\
--region $Region\
--cluster-identifier $SourceRedshift\
--snapshot-identifier $SourceRedshift-refresh-snap-$Snapdate
{% endhighlight %}

Restore the Snapshot
--------------------

{% highlight shell %}
aws redshift restore-from-cluster-snapshot\
--region $Region\
--cluster-identifier $DestRedshift\
--snapshot-identifier $SourceRedshift-refresh-snap-$Snapdate\
--cluster-subnet-group-name reshiftsubnet\
--cluster-parameter-group-name default.redshift-1.0\
--vpc-security-group-ids  "sg-id1" "sg-id2"
{% endhighlight %}

Delete Old snapshot(Which is created by this script):
-----------------------------------------------------

{% highlight shell %}
Deldate=prod-cluster-refresh-snap-`date -d "1 days ago" +%Y-%m-%d`
Delsnap=$(aws redshift describe-cluster-snapshots --region ses-region --query 'Snapshots[].SnapshotIdentifier' --output json | grep $Deldate |   sed -n '2p' |  sed 's|[",,]||g')
aws redshift delete-cluster-snapshot\
--region $Region\
--snapshot-identifier $Delsnap
{% endhighlight %}


The complete script with email alert:
-------------------------------------

{% highlight shell %}

#!/bin/bash
# ----------------------------------------------------------
# RECREATE REDSHIFT CLUSTERS FROM RUNNING CLUSTER'S SNAPSHOT
# ----------------------------------------------------------

# Version: 1.0
# Created by: @BhuviTheDataGuy
# Blog URL: https://thedataguy.in/aws/automate-aws-redshift-snapshot-and-restore/

# Create IAM user with keys assign Redshift nessessary access 
# and SES send raw email access

# READ CAREFULLY
# --------------
# Change the below things:
# AWS CLI must be installed
# YOUR_ACCESS_KEY
# YOUR_SECRET_KEY
# prod-cluster -> Prod/Main cluster name
# dev-cluster -> New Test/DEV cluster name
# REDSHIFT-REGION -> Region where your cluster located
# ses-region -> Region for your SES
# from@domain.com -> From Address for SES (this should be verified one)
# to@domain.com,to2@domain.com -> Who all are needs to get the email notification
# default.redshift-1.0 -> If you are using custom parameter group then replace this with that name.
# "sg-id1" "sg-id2" -> Security group ids that you want to attach it to Redshift Cluster.


#function for kill the process once its failed
die() { echo >&2 "$0 Err: $@" ; exit 1 ;}

#Export Access Keys
export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"

#Input Parameters
#For Cluster Refresh
Snapdate=`date +%Y-%m-%d-%H-%M-%S`
SourceRedshift='prod-cluster'
DestRedshift='dev-cluster'
Region='REDSHIFT-REGION'


#Delete Cluster
echo "Delete Cluster ... Please wait" 

aws redshift  delete-cluster \
--region $Region  \
--cluster-identifier  $DestRedshift \
--skip-final-cluster-snapshot || die | aws ses send-email \
  --region ses-region \
  --from "from@domain.com" \
  --destination "to@domain.com,to2@domain.com" \
  --message "Subject={Data=RedShift Refresh  Failed,Charset=utf8},Body={Text={Data=Refreshing the redshift cluster is failed. 
  Step: Delete Cluster,Charset=utf8}}"

sleep 5m
echo "Cluster Deleted !!!"

#Take snapshot
echo "Taking Snapshot ... Please wait" 

aws redshift create-cluster-snapshot \
--region $Region  \
--cluster-identifier $SourceRedshift  \
--snapshot-identifier $SourceRedshift-refresh-snap-$Snapdate || die | aws ses send-email \
  --region ses-region \
  --from "from@domain.com" \
  --destination "to@domain.com,to2@domain.com" \
  --message "Subject={Data=RedShift Refresh  Failed,Charset=utf8},Body={Text={Data=Refreshing the redshift cluster is failed. 
  Step: Take snapshot,Charset=utf8}}"

sleep 15m
echo "Snapshot Created !!!"

#Restore snapshot
echo "Restoring Snapshot... Please wait!"

aws redshift restore-from-cluster-snapshot \
--region $Region \
--cluster-identifier $DestRedshift  \
--snapshot-identifier $SourceRedshift-refresh-snap-$Snapdate \
--cluster-subnet-group-name reshiftsubnet \
--cluster-parameter-group-name default.redshift-1.0 \
--vpc-security-group-ids  "sg-id1" "sg-id2" || die | aws ses send-email \
  --region ses-region \
  --from "from@domain.com" \
  --destination "to@domain.com,to2@domain.com" \
  --message "Subject={Data=RedShift Refresh  Failed,Charset=utf8},Body={Text={Data=Refreshing the redshift cluster is failed. 
  Step: Restore snapshot,Charset=utf8}}"

sleep 60m
echo "Snapshot Restored !!!"

#Delete old snapshot
echo "Old Snapshot Deleteing!!!"

Deldate=prod-cluster-refresh-snap-`date -d "1 days ago" +%Y-%m-%d`
Delsnap=$(aws redshift describe-cluster-snapshots --region ses-region --query 'Snapshots[].SnapshotIdentifier' --output json | grep $Deldate |   sed -n '2p' |  sed 's|[",,]||g')
aws redshift delete-cluster-snapshot \
--region $Region \
--snapshot-identifier $Delsnap  || die | aws ses send-email \
  --region ses-region \
  --from "from@domain.com" \
  --destination "to@domain.com,to2@domain.com" \
  --message "Subject={Data=RedShift Refresh  Failed,Charset=utf8},Body={Text={Data=Refreshing the redshift cluster is failed. 
  Step: Delete Old snapshot,Charset=utf8}}"
  {% endhighlight %}
