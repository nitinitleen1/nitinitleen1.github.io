---
layout: post
title: Don't Use AWS AMI To Backup Your EC2 Database Server
date: 2018-02-04 09:24:50.000000000 +00:00
description: AWS Snapshots are inconsistent, Its not a good practice to use taking AMI to backup the databases. We faced PostgreSQL index corruption issue because of the instance launched from the AMI of another PostgreSQL server.
categories:
- AWS

tags:
- aws
- ec2
- postgresql
- ebs
- snapshot

---

![Don't Use AWS AMI To Backup Your EC2 Database Server]({{ site.baseurl }}/assets/Dont-Use-AWS-AMI-To-Backup-Your-EC2-Database-Server.jpg)

I have started my career to handle the databases which all are in the Cloud. Most of the database servers are in AWS EC2. AMI is one the simplest and great feature to take a VM level backup and restore it when a disaster happens. But DBAs never depend on the VM or SAN backups, so I have configured native backups for all of my database servers. But I used to choose to restore the AMI whenever we need a Dev/Test server. Because restoring a huge database will take more time and its pretty expensive operation. So I just drop the existing Dev DB server and launch it from the AMI.

But a few weeks before, I was working with a PostgreSQL migration process from EC2 to RDS using [DMS](https://aws.amazon.com/dms/)(AWS Database Migration Service). But the challenge was the EC2 PostgreSQL is 9.2. DMS supports the source as PostgreSQL 9.3+. So I decided to upgrade the PostgreSQL version to 9.6 on a Dev Server. And this is what happened.

1.  I have a Master-Slave setup, so I took the AMI of the Master instance.
2.  Launched a new instance from the AMI.
3.  Upgrade the PostgreSQL version to 9.6.
4.  Then started the DMS to migrate the data to RDS.

But it didn't give the expected the Results. I got the below error in few tables.
{% highlight shell %}
ERROR: duplicate key value violates unique constraint "table_Primary_key", DETAIL: Key  (id, newid)=(136, 1134) already exists., CONTEXT: COPY table.
{% endhighlight %}

Seems the table has duplicate values in the primary key column. Then I queried the table to find if any values are duplicated. And the result is Yes, There many values are repeated in the Primary Key column. Then I returned to my actual master server and checked the duplicate values and I didn't find anything there.

So came to know **the Primary Key index on few tables gets corrupted**.

Then I tried to Rebuild the Index and got this error.
{% highlight shell %}

WARNING: concurrent delete in progress within table "my_table"
ERROR: could not access status of transaction 3769812823
DETAIL: Could not open file "pg_subtrans/EGBZ": No such file or directory.
CONTEXT: while checking uniqueness of tuple  (13602,106) in relation "my_table"
{% endhighlight %}

I taught the PostgreSQL upgrade did this corruption. So I tried to launch the instance from the same AMI and checked duplicate values(before upgrading the PostgreSQL version). Shocking!! So many indices get corrupted. Then I tried to Rebuild the index and got this error.
{% highlight shell %}

WARNING:concurrent delete in progress within table "my_table"
WARNING: concurrent delete in progress within table "my_table"
WARNING:concurrent delete in progress within table "my_table"
WARNING: concurrent delete in progress within table "my_table"
WARNING:concurrent delete in progress within table "my_table"
WARNING: concurrent delete in progress within table "my_table"
{% endhighlight %}

### So what exactly happened and why the indices were corrupted?

After launching the instance from the AMI, I tried to start the PostgreSQL, but it didn't start. It throws the below error message. So I reset the xlog and started the PostgreSQL.

Yes, **the xlog** (some ongoing delete transactions, the error which showed while starting PostgreSQL -- *`WARNING: concurrent delete in progress within table "my_table"`*) made this corruption.

### Summary

I remember that one of my Technical Manager already said the  **AWS snapshots are not consistent.(its applicable for AMIs too)**

*While taking the AMI, some delete operations were going in the DB. It didn't complete. So after launching the instance, it tried to roll back the transaction, but it didn't have anything to rollback the transaction. Then while resetting the xlog it made the corruption on the Primary Key indices.*

Here are the reference links to take consistent Snapshots for MySQL Database Server.

1.  [Take consistent Snapshot using System Manager](https://aws.amazon.com/blogs/compute/automating-the-creation-of-consistent-amazon-ebs-snapshots-with-amazon-ec2-systems-manager-part-1/)
2.  [Take consistent Snapshot using Microsoft VSS.](https://aws.amazon.com/blogs/compute/automating-the-creation-of-consistent-amazon-ebs-snapshots-with-amazon-ec2-systems-manager-part-2/)

### Bonus:

**You may think [AWS RDS](https://aws.amazon.com/documentation/rds/) is using [SnapShots](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateSnapshot.html) to take the backups, so will there also this kind of issue occur? **

In RDS, there are using some internal mechanism to suspend the IO activity on the disk for few milliseconds before taking the Snapshot. So we will not face these issues in RDS. This is like the same method which I mentioned in the reference links.

![Don't Use AWS AMI To Backup Your EC2 Database Server_1]({{ site.baseurl }}/assets/Dont-Use-AWS-AMI-To-Backup-Your-EC2-Database-Server_1.jpg)

