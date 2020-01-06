---
layout: post
title: How To Restore Corrupted System Databases
date: 2017-12-31 13:55:03.000000000 +00:00
description: This post is for restore corrupted system databases on SQL Server including the master, model, and msdb databases. Recovered all system databases from backup file.
categories:
- SQLserver
tags:
- backup
- recovery
- sqlserver

---

![How To Restore Corrupted System Databases]({{ site.baseurl }}/assets/How-To-Restore-Corrupted-System-Databases.jpg)

Today Dec 31, Sunday. Everybody waiting for the New Year. I'm also waiting for that and enjoying the last holiday of this year. But my SQL server doesn't like the 2018 I guess  We have migrated our SQL Datawarehouse from Datacenter to AWS. We followed block level copying method which means sent entire Disks data to AWS then create volumes from that data. We kept data and logs on different disks.

During the migration, we have migrated the data volume first and then migrated log disk after 10hrs. In between the 10hrs, the log file has grown a bit and the LSN chain get changed. In the MDF file its showing different LSN. Once everything has been migrated the SQL server was unable to start. Then we found the data corruption on the Master, Model and msdb databases. And yes, you are right the holiday went to DR day. Here is the story I restore corrupted system databases.

Initially, I taught master DB has corrupted.

>ERROR message
The log scan number (17:128:7) passed to log scan in database 'master' is not valid. This error may indicate data corruption or that the log file (.ldf) does not match the data file (.mdf). If this error occurred during replication, re-create the publication. Otherwise, restore from backup if the problem results in a failure during startup.

I can't able to start the SQL server without master DB, Even I can't restore the master DB with starting the SQL Server. So here are the steps I followed to restore the master DB.

1.  Rebuild the Master DB from the scratch.
2.  But unable to start SQL, because msdb and model databases are corrupted.
3.  Again rebuild the master DB.
4.  Moved the MSDB and model database's Data files to the previous Location.
5.  Restored the msdb and Model DB from the Backup.
6.  Restored the Master Database

Rebuild the Master Database:
----------------------------

-   Im using SQL Server 2012.
-   Go to this location.
{% highlight powershell %}
C:\Program Files\Microsoft SQL Server\110\Setup Bootstrap\SQLServer2012
{% endhighlight %}

-   Open the command prompt in this location.
-   Run this command to rebuild the master DB.
{% highlight powershell %}

.\Setup.exe /QUIET /ACTION=REBUILDDATABASE /INSTANCENAME=MSSQLSERVER /SAPWD= Sql@123
{% endhighlight %}

Done. Now it's a fresh database and the model and msdb are rebuild as new databases.

Move the master database files to the previous location:
--------------------------------------------------------

My previous data files located like below,

| master | Z:\DATA\SystemDB\master.mdf |
| masterlog | F:\Logs\SystemLog\mastlog.ldf |
{% highlight sql %}

USE master;
GO
ALTER  DATABASE master
MODIFY FILE (NAME = master, FILENAME = 'Z:\DATA\SystemDB\master.mdf');
GO
ALTER  DATABASE msdb
MODIFY FILE (NAME = masterlog, FILENAME = 'F:\lOGS\SYSTEMLOG\masterlog.ldf');
GO
{% endhighlight %}


-   Stop SQL server.
-   Move the MDF and LDF files to the respective locations.
-   Start SQL Server.

Restore the Old master Database from Backup:
--------------------------------------------

-   Stop SQL Server.
-   Start SQL server with Singler user mode.
-   Open Powershell and went to the below Directory.
{% highlight powershell %}

C:\Program Files\Microsoft SQL Server\MSSQL11.MSSQLSERVER\MSSQL\Binn
{% endhighlight %}

-   Run this command in Powershell
{% highlight powershell %}

.\sqlservr.exe -m
{% endhighlight %}

-   Open a command prompt window.
{% highlight powershell %}

sqlcmd -U sa -p
Restore database master from disk ='O:\master_full.bak' with replace;
GO
{% endhighlight %}

-   Once it's restored the SQL server will be automatically stopped.
-   Started SQL Server and the master database was completely recovered.

### Shocking!! SQL server won't start again. Another issue with Model and **msdb** databases.

> ERROR message
The log scan number (17:132:14) passed to log scan in database 'msdb' is not valid. This error may indicate data corruption or that the log file (.ldf) does not match the data file (.mdf). If this error occurred during replication, re-create the publication. Otherwise, restore from backup if the problem results in a failure during startup.

Again the same issue. Ok, then I decided to recover the MSDB and Model databases first.

Recover MSDB and MODEL Databases:
---------------------------------

-   Again I rebuild the Master database (followed the above steps)
-   Execute the below query to move the files to the different drive.
-   Stop SQL server and move the datafiles to the respective folders, then start the SQL Server.
{% highlight sql %}

USE master;
GO
ALTER DATABASE model;
MODIFY FILE (NAME = model, FILENAME = 'Z:\DATA\SystemDB\model.mdf');
GO
ALTER DATABASE msdb
MODIFY FILE (NAME = modellog, FILENAME = 'F:\lOGS\SYSTEMLOG\modellog.ldf');
GO

ALTER DATABASE msdb;
MODIFY FILE (NAME = MSDBData, FILENAME = 'Z:\DATA\SystemDB\MSDBData.mdf');
GO
ALTER DATABASE msdb
MODIFY FILE (NAME = MSDBlog, FILENAME = 'F:\lOGS\SYSTEMLOG\MSDBData.ldf');
GO
{% endhighlight %}

In SSMS,
{% highlight sql %}

Restore database model from disk ='O:\model_full.bak' with replace;
Restore database msdb from disk ='O:\msdb_full.bak' with replace;
{% endhighlight %}

Done!!

Restore the Master Database:
----------------------------

Now restore the Master database from the backup file.

-   Stop SQL Server.
-   Start with single User mode.
-   Restore the database using SQLCMD.
{% highlight sql %}

Restore database master from disk ='O:\master_full.bak' with replace;
{% endhighlight %}

Finally, I have recovered all the system databases. But few of the databases went to suspect mode, but its not biggest deal to fix them.