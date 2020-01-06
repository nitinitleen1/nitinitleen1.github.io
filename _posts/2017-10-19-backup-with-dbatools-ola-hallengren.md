---
layout: post
title: SQLServer Backup with dbatools vs Olahallengren
date: 2017-10-19 15:08:27.000000000 +00:00
description: A comparison for dbatools vs olahallengren for backup the SQL Server databases. We explained the pros and cons for using both tools.
categories:
- SQLserver
tags:
- backup
- dbatools
- olahallengren
- powershell
- sqlserver

---
![SQLServer Backup with dbatools vs Olahallengren]({{ site.baseurl }}/assets/SQLServer-Backup-with-dbatools-vs-Olahallengren.jpeg)


> **Short Story:** The [dbatools ](https://dbatools.io/)is growing too fast, so many Powershell modules are there. I just compared the backup module with Ola Hallengren's backup script.

Who all are working as a SQL Server DBA, we must be scheduled the backup job in SQL Agent with our own TSQL scripts. But most of the DBAs are recommended to use Ola hallengren's backup script. Because it gives us a reliable backup and easy to locate the backup files. I'm also a fan of Ola's script. Im using this in my all production servers.

I had a situation to create a backup maintenance job without SQL agent. Oh god, this is not fair. There are so many ways available to configure this, but without SQL agent..... there is a question mark. OK fine, I had an Option, PowerShell in Task Scheduler. Instead of using SQL PowerShell module to take the backup, I have executed the ola's backup commands inside the PowerShell. Yes, this is good, its working as I expected. But the problem is sometimes it didn't work and I don't have any logs for that. So I decided to use dbatools. I have compared many options with ola's scripts. Lets see the results.

I have AdventureWorks and WideWorldImporters database on my computer and I have SSD Storage.

**Backup Folder:**

In Ola's scripts creates the backup folders as more predictable. Its pretty good to find a backup file. dbatools are has this option but it doesn't create a folder based on backup type.

 ![SQLServer Backup with dbatools vs Olahallengren]({{ site.baseurl }}/assets/SQLServer-Backup-with-dbatools-vs-Olahallengren1.jpeg)

**Backup Time:**

Ola's backup took 5 sec to take the backup, dbatools took *10sec*. Oh its pretty slow.

**Backup File Names:**

In Ola's scripts, the backup file contains a keyword for backup types, like Full, Diff. dbatools doesn't have this one. It just creates the file like *Datababsename_yyyymmddhhmmss.bak*

 ![SQLServer Backup with dbatools vs Olahallengren2]({{ site.baseurl }}/assets/SQLServer-Backup-with-dbatools-vs-Olahallengren2.jpeg)

**Copy Only:**

dbatools is taking all the backups with Copy Only, but in Ola's script you need to add *@Copyonly='Y'*.

**Stats Message:**

Ola's scripts are giving a more detailed message for backups, like Is standby, Recovery Model, Encrypted, Differential LSN, but dbatools gives limited details only.

 ![SQLServer Backup with dbatools vs Olahallengren2]({{ site.baseurl }}/assets/SQLServer-Backup-with-dbatools-vs-Olahallengren3.png)

**Cleanup:**

Ola's scripts have the cleanup option in the same module, dbatools you need to execute Backup-Remove module to clean up.

**Verify, Checksum, Compress:**

These options are same on both sides.

**Who is the Winner?**

dbatools are not only for backups, its taking care a dba's work, so we can't say this is not good for backups, they are doing as much as they can. But ola's scripts too good for Backups. Why?

-   Encrypted backups
-   Backup to multiple locations
-   Backup to Azure Blob
-   Cleanup
-   Integrate with third party backup tools.
-   and more options.