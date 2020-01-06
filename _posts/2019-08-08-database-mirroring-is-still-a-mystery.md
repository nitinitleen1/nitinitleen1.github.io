---
title: Database Mirroring is still a Mystery
date: 2019-08-08 04:30:00 +0000
description: The mistery in Database mirroring between SQL Server 2014 Standard and SQL Server 2017 Enterprise
categories:
- SQLserver
tags:
- sqlserver
- mirroring
- migration
- GCP
- Backup
image: "/assets/Database Mirroring is still a Mystery.jpg"

---
**Database Mirroring** - A replication feature which supports automatic failover and supported in standard as well. During SQL server 2016, Microsoft announced that Mirror will be removed from further releases. But still, its there and Documentations are showing it's going to deprecate soon. The Alwayson Availability Groups is the permanent High availability solution for SQL server.

Then why am I writing this blog?

Im doing a lot of database migrations to the Cloud. We can do this migration in many ways.

1. Backup and restore - More downtime.
2. Log Shipping - Lot of jobs needs to be created if you have more databases.
3. Log backup restore script - DBAtools or you can automate your script to restore log backups instead of going with native log shipping.
4. Mirroring - Need same version and edition for both Primary and Mirror.
5. Alwayson - Enterprise feature, Need active directory, cluster and etc.

Every method has its own prod and cons. So for migrations, mostly I use Alwayson. But if the database infra is a small one, then I prefer Mirroring. Im sharing my horror story of migrating the SQL server 2014 standard to SQL server 2017 Enterprise.

## Background of the DB server:

* SQL server 2014 RTM Standard.
* 60+ databases.
* Mirroring has been configured with Witness.
* Overall size 1TB.
* NO active directory setup.

## Initial Migration Plan:

1. Im going to migrate this database server from On-Prem to GCP.
2. Target Database version SQL Server 2017 Enterprise.
3. On Primary server, stop mirroring and convert the existing Mirroring setup to log shipping. [Here is an awesome blog for this](https://www.sqlservercentral.com/articles/convert-mirroring-to-log-shipping).
4. Recreate Mirroring Endpoint with Certificate based authentication.
5. Setup Mirroring between SQL Server 2014 to 2017.

I broke the existing Mirroring and created both endpoints with certificate based authentication. I took a small database's full and log backup then restored it on Mirrored server.

### Adventure 1:

My wrong estimation that SQL Server Mirroring supports higher versions, but failback is not possible. It was wrong, we must use the same edition.

### Adventure 2:

We can't setup this using SSMS, but no one will stop me to setup mirroring using T-SQL. Yes, I did it. But wait, again the database state changed from Mirror/Synchronized to Restoring. My bad!!!

I tried to setup the mirroring again, but no luck within 5 to 10 seconds it was breaking.
And here is the error from both servers.

{% highlight shell %}
Database mirroring connection error 4 'An error occurred while receiving data: 
'10054(An existing connection was forcibly closed by the remote host.)'.' 
for 'TCP://10.10.10.14:5022'.

Database mirroring has been terminated for database 'db_name'. 
This is an informational message only. No user action is required.
{% endhighlight %}

After some research, we found this useful information from [DBA StackOverflow](https://dba.stackexchange.com/a/161710/105575) and its answered by  Ola Hallengren.  Its a known bug and reported already.

### Adventure 3:

So now we figured it out its a bug. But the strange thing is, we found that this bug is in `SQL Server 2014, 2016 and SQL server 2017 RTM`. We need to Patch our Primary and Mirror Server as well.

### Adventure 4:

I already broke the replication. So no HA for now. If I do the Patch, its downtime. But its a very busy online booking system for travel, hotel and etc. So we got RED signal from the business team. So not even one minute of downtime for patch.

### Adventure 5:

Here I was trying to mirror between two different versions of SQL Server and its not recommended. OK, let try with the exact version of SQL server version. I launched the SQL Server 2014 Standard from the GCP's application images. It has the latest SP and CU. Shocking !!!

It's working fine.

### The Miracle:

From the above statement, the SQL Server version and Editions are the same. But the only change is, it has the latest CU and SP.  Then let's try SQL server 2017 Enterprise, do Patch there and then Mirror it. Woohoo!!!

Its fixed.  But don't sit back and relax, it worked only for 50% of the databases. Rest of the databases are still throwing the same error.

### Adventure 6:

In Mirroring setup, to take Log backups, I used [Ola Hallengren backup script](https://ola.hallengren.com/sql-server-backup.html). But the FULL backup I restored is taken from the SQL server Maintenance wizard. They configured this for Full backup and Compression is the Only Option is enabled.

![](/assets/Database Mirroring is still a Mystery1.png)

### One more Miracle:

Then I wanted to try the Mirroring once on the failed databases. I took a fresh copy of FULL and LOG backup using Ola Hallengren script. Then I setup the mirroring. And finally, It worked. 

### Last but not least:

Mirroring is running fine. But unfortunately, we can't see the replication lag. Unsent / Unrestored log size. Even in Mirroring Monitor, its showing Secondary is not connected. So no other way to check the lag. But one option is there. sp_dbmmonitorresults will return the status of the mirroring.

### Lessons learned:

Every migration has a lot of fun and adventures. Every time we are learning new.

1. I know SQL server always on can be established from lower version to higher version only for the version upgrade or migration. But mirroring will not officially recommend this practice.
2. Before testing/Poc, don't break the existing HA setup for any reason.
3. Keep your SQL server in RTM is very Bad even the database is performing well.  Make sure you have at least the latest SP.
4. I don't know why people still using SQL server maintenance wizard to setup backups. But whatever backup job you are using make sure Verify and checksum options are enabled.
5. But in my case, still its not clear how the mirroring worked after I took backups from the custom script.
6. Setting up mirroring between two different versions, will never show the lag, but sp_dbmmonitorresults will tell you the status of mirroring.

   ![](/assets/Database Mirroring is still a Mystery2.png)
7. The best practice, before doing the cutover, just promote one of the Mirrored databases and check you have the latest data.  A simple trick, before doing the failover, create a test table and see its replication or not after the failover.