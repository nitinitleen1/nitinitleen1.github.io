---
layout: post
title: Automation Script For Percona Xtrabackup FULL/Incremental
date: 2019-01-01 15:33:18.000000000 +00:00
description: Percona xtrabackup support incremental backup. Here we automate percona xtrabackup for full and incremtnal backup using shell script.

categories:
- MySQL

tags:
- backup
- mysql
- recovery
- restore
- xtrabackup
- Backup and Recovery


---
![Automation Script For Percona Xtrabackup FULL/Incremental]({{ site.baseurl }}/assets/Automation-Script-For-Percona-Xtrabackup-FULLIncremental.jpg)

Image Source: DigitalOcean

This is my first post in 2019, and Im starting with a MySQL solution. In MySQL world, implementing a better backup strategy to meet all of your requirement is still a challenging thing. The complexity depends on your RPO and RTO. Percona has many tools to help DBAs in many scenarios. **`[Xtrabackup](https://www.percona.com/software/mysql-database/percona-xtrabackup)`** is one of the best backup tools to perform a better backup on TeraBytes size of databases. Also, another great feature is it supports Incremental and Differential backup.

There are couple of tools which is available in MySQL world, But due to some restrictions we can't achieve what we are expecting.

#1 [mysqldump](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)
----------------------------------------------------------------------

This is a widely used backup tool and most of the DBAs are trust this. This comes with the mysql package. Initially, it was a single thread process but now we have multi-thread in native mysqldump. Its completely a logical backup tool. It has a wide range of parameters to use while taking backups (like include routines, events, triggers).

**Right place to use** `mysqldump﻿`

Use if your databases are less than 20GB. Because the restore process will take more time. This will affect your RTO.

### Advantages:

-   Easy to use
-   More detailed documentation.
-   Multi-Thread (we need to add parameters to perform this)
-   Comes with MySQL, so they will fix if any bugs and implementing new features.

### Drawbacks:

-   Backup is multi-thread, but not restore. Its still a single thread process.
-   No incremental backup feature.
-   Restoration takes more time for large backups.

#2 [mydumper/myloader](https://github.com/maxbube/mydumper)
-----------------------------------------------------------

This is an opensource tool and DBAs are using this for dump the huge databases. It has inbuild multi-thread dump and restore feature. This is the pioneer for mysql's multi thread dump. It supports snapshot consistency. So it'll provide the accurate binlog file and its position.

**The right place to use** `mydumper/myloader`

If you have the databases grater then 20GB to TB/PB. I have used this to dump TB size. If you used this to take dump for a PB size DB using mysqldumper then please comment below.

### Advantages:

-   Multi-thread backup and restore.
-   Supports for Incremental backups.
-   Log the binlog info, so we can easily built a new slave.
-   We can control the number of threads.
-   Compression support.
-   Include/Exclude tables in backup.
-   Split the table into chunks.
-   And etc,etc.

### Drawbacks:

-   This is also a logical dump. So it needs to scan the complete tables.
-   Performance degrade during the backup.
-   No checksum.

#3 [Percona Xtrabackup](https://www.percona.com/software/mysql-database/percona-xtrabackup):
--------------------------------------------------------------------------------------------

This is my favourite opensource tool from Percona. This is also supports incremental backup. The main reason is its very fast since its Physical backup. Instead of reading my story just go through this [Doc link](https://www.percona.com/doc/percona-xtrabackup/LATEST/index.html) and see its features.

You can use this to backup >20GB databases to TB or PB.

### Advantages:

-   Multi-thread
-   Super fast
-   Compression
-   Checksum
-   Encryption
-   Master/Slave binlog info.
-   Directly restore the backups to AWS Aurora.

### Drawback:

-   Not much, I'll update this section if I found something.

Shell Script to Automate Xtrabackup:
------------------------------------

Now coming to the automation part. Im using a shell script to automate FULL and Incremental backup also sync them with GCS and S3. This script is already written by [bigzaqui](https://www.percona.com/forums/questions-discussions/percona-xtrabackup/10772-[script]-automatic-backups-incremental-full-and-restore) at 2013. But I replaced innobackupex with Xtrabackup and few more changes.

### Parameters needs to change:

-   **`-u sqladmin`** -- Mysql user to take the dump. Replace with `-u your_user`
-   **`SECRET='mysql-user-password'`**-- Mysql user's password.
-   **`--history`**-- Im tacking backup activity into a database. If you don't want to track just remove this.
-   **`--slave-info`** -- If you are taking the backup from a slave, it'll capture the master's binloginfo. So you can setup a new replica for the Master Server. You can remove this if you are not using slave to take backup.
-   **`--compress-threads=4,---parallel=4`** The number of threads needs to perform compress. Its a best practice to allocate 30%-40% from the total cores. I have 40core cpu, so I used 15 threads.
-   **`--remove-original`** -- While decompressing a compressed backup, it'll leave the compressed files. So this will remove compressed files after the extraction process.
-   **`BACKUP_DIR=/mysqldump/xtrabackup/`** -- Location for saving the dump.
-   **`DATA_DIR=/mysqldata`** -- Location of mysql data directory. If you added **`[xtrabackup]`** parameters in **`my.cnf`** file, then no need to mention this.

<script src="https://gist.github.com/SQLadmin/e9706736186fab3135822c291eee99c6.js"></script>

Run this script:
----------------

-   **FULL Backup** -- `./xtrabackup_full_increment_restore.sh full`
-   **Incremental Backup** -- `./xtrabackup_full_increment_restore.sh incremental`
-   **Restore** -- `./xtrabackup_full_increment_restore.sh restore`