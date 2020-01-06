var store = [{
        "title": "SQLServer Backup with dbatools vs Olahallengren",
        "excerpt":"Short Story: The dbatools is growing too fast, so many Powershell modules are there. I just compared the backup module with Ola Hallengren’s backup script. Who all are working as a SQL Server DBA, we must be scheduled the backup job in SQL Agent with our own TSQL scripts. But most of the...","categories": ["SQLserver"],
        "tags": ["backup","dbatools","olahallengren","powershell","sqlserver"],
        "url": "http://localhost:4000/backup-with-dbatools-ola-hallengren/"
      },{
        "title": "How To Map Linux Users To Postgres User",
        "excerpt":"Map root user to Postgres user I had a chance to map Linux users to Postgres. Recently I have started to understand the PostgreSQL’s internal processing. One of the topics explained about the pg_ident.conf file. Till that time I never used that file, even I didn’t hear about that. Basically,...","categories": ["PostgreSQL"],
        "tags": ["linux","postgresql","security"],
        "url": "http://localhost:4000/map-linux-users-to-postgres-user/"
      },{
        "title": "SQL Server All In One Security Audit Script",
        "excerpt":"As a DBA, Secure my SQL server is a pretty important part. Generally Security in the sense most of us point to users and their weak passwords. But apart from user accounts, there are some critical parts are also there. Instead of googling it and execute all the queries which...","categories": ["SQLserver"],
        "tags": ["security","sqlserver","tsql"],
        "url": "http://localhost:4000/sql-server-security-audit-script/"
      },{
        "title": "What Is AWS Aurora Database Clone",
        "excerpt":"Aurora is one of the greatest inventions of AWS’s managed database services. I recommend this everyone to use this instead of MySQL.A few days back they have announced a new feature called Cloning the database. Initially, I taught this is same as restoring the database from the snapshot or point...","categories": ["AWS"],
        "tags": ["aurora","aws","mysql","rds"],
        "url": "http://localhost:4000/aws-aurora-database-clone/"
      },{
        "title": "How To Install Oracle 12C on Amazon Linux In Silent Mode",
        "excerpt":"Before start my story, I need to tell this, I’m not an Oracle guy. But as a DBA I had few situation to install Oracle on Amazon Linux. In many blogs, we can get the steps to install in CentOS and RedHat, but my bad I couldn’t find any blogs...","categories": ["Oracle"],
        "tags": ["12c","aws","installation","linux","oracle"],
        "url": "http://localhost:4000/install-oracle-12c-amazon-linux-silent-mode/"
      },{
        "title": "Compare Two SQL Server Databases using Tsql",
        "excerpt":"I’m glad to inform that today I’m going to release my next phase of TsqlTools is SQLCOMPARE. I was in a point to compare two databases which are on two different servers, I have checked many websites and blogs, but unfortunately, I didn’t find any useful T-SQL query for that. But...","categories": ["SQLserver"],
        "tags": ["sqlserver","tsql"],
        "url": "http://localhost:4000/compare-two-sql-server-databases-using-tsql/"
      },{
        "title": "How To Change MySQL Default Data,Binlog,Error Log Directories",
        "excerpt":"MySQL Change default directories While reading this heading everybody things like, yeah its pretty old topic, we can get many articles by googling. But you know what sometimes well known things never work for us. This time it happened for me, my bad. I have done this many times. But...","categories": ["MySQL"],
        "tags": ["linux","mysql","ubuntu"],
        "url": "http://localhost:4000/change-mysql-default-directories/"
      },{
        "title": "Postgresql Insecure directory in ENV PATH - Unable To Start",
        "excerpt":"Insecure directory in $ENV{PATH} I was discussing with one of my friend who is a Developer, as he was working with PostgreSQL 9.5 in Ubuntu 16.04LTS from past few months. But suddenly he couldn’t able to start PostgreSQL service. He tried to reinstall PostgreSQL many times, but no luck. So...","categories": ["PostgreSQL"],
        "tags": ["linux","postgresql","ubuntu"],
        "url": "http://localhost:4000/postgrsql-insecure-directory-in-env-path/"
      },{
        "title": "Configure Bucardo replication on CentOS",
        "excerpt":"I was working with a migration process to migrate the Postgresql Database from Ec2(centos) to AWS RDS. Since I did many migrations to RDS but this is my first migration with Postgresql. The challenge was the source database in Postgresql 9.2 and I wanted to 9.6 on RDS. So decided...","categories": ["PostgreSQL"],
        "tags": ["bucardo","centos","postgresql","replication"],
        "url": "http://localhost:4000/configure-bucardo-replication-centos/"
      },{
        "title": "How To Restore Corrupted System Databases",
        "excerpt":"Today Dec 31, Sunday. Everybody waiting for the New Year. I’m also waiting for that and enjoying the last holiday of this year. But my SQL server doesn’t like the 2018 I guess  We have migrated our SQL Datawarehouse from Datacenter to AWS. We followed block level copying method which means sent entire...","categories": ["SQLserver"],
        "tags": ["backup","recovery","sqlserver"],
        "url": "http://localhost:4000/restore-corrupted-system-databases/"
      },{
        "title": "Don't Use AWS AMI To Backup Your EC2 Database Server",
        "excerpt":"I have started my career to handle the databases which all are in the Cloud. Most of the database servers are in AWS EC2. AMI is one the simplest and great feature to take a VM level backup and restore it when a disaster happens. But DBAs never depend on...","categories": ["AWS"],
        "tags": ["aws","ec2","postgresql","ebs","snapshot"],
        "url": "http://localhost:4000/dont-use-aws-ami-backup-ec2-database-server/"
      },{
        "title": "Automatically Enable CDC In RDS SQL Server",
        "excerpt":"AWS recently announced a new feature which will help to enable CDC in RDS SQL server on user databases. Here this the detailed blog post that explains how to enable this CDC for DMS service. CDC is an enterprise edition feature. But RDS SQL Server Standard editions are supporting CDC. The most important thing...","categories": ["AWS"],
        "tags": ["aws","cdc","dms","rds","sqlserver"],
        "url": "http://localhost:4000/automatically-enable-cdc-in-rds-sql-server/"
      },{
        "title": "Why Windows Server 2016 In AWS Unable To Resolve Public And Local DNS",
        "excerpt":"Before reading further about this DNS issue, I want to clarify few things. This issue happened only in AWS. Windows Server 2016 has this issue. On Domain Controller, I was Able to access the internet before configuring the AD/DNS. On Member Server, I was able to access the internet before...","categories": ["AWS"],
        "tags": ["active directory","aws","dns","windows server"],
        "url": "http://localhost:4000/windows-server-2016-in-aws-unable-to-resolve-public-and-local-dns/"
      },{
        "title": "How To Migrate PostgreSQL Users To AWS RDS PostgreSQL",
        "excerpt":"How To Migrate PostgreSQL Users To AWS RDS PostgreSQL](/assets/How-To-Migrate-PostgreSQL-Users-To-AWS-RDS-PostgreSQL.jpg) According to PostgreSQL migration, we can migrate the databases and tables. I was migrating a Postgresql environment from EC2 to RDS Postgresql. I have completed the data migration. In many blogs, they have mentioned the steps to migrate PostgreSQL users to another...","categories": ["PostgreSQL"],
        "tags": ["aws","migration","postgresql","rds"],
        "url": "http://localhost:4000/migrate-postgresql-users-aws-rds-postgresql/"
      },{
        "title": "Automatically Add EC2 Instances to Active Directory Domain",
        "excerpt":"Windows Servers are in AWS will show some glitches in sometimes. My previous articleexplains how Windows Server 2016 had some issues with DNS Suffix and Forwarders. This time I got a chance to play around with PowerShell automations. The requirement is automatically add EC2 instances to Active directory domain during the...","categories": ["AWS"],
        "tags": ["active directory","automation","autoscaling","aws","powershell","scripting","windows server"],
        "url": "http://localhost:4000/automatically-add-ec2-instances-to-ad/"
      },{
        "title": "Automate AWS Athena Create Partition On Daily Basis",
        "excerpt":"In my previous blog post I have explained how to automatically create AWS Athena Partitions for cloudtrail logs between two dates. That script will help us to create the partitions till today. But cloudtrail will generate log on everyday. So I was thinking to automate this process too. For this...","categories": ["AWS"],
        "tags": ["athena","automation","aws","cloudtrail","python"],
        "url": "http://localhost:4000/automate-aws-athena-create-partition-on-daily-basis/"
      },{
        "title": "AWS Athena Automatically Create Partition For Between Two Dates",
        "excerpt":"AWS Athena is a schema on read platform. Now Athena is one of best services in AWS to build a Data Lake solutions and do analytics on flat files which are stored in the S3. In the backend its actually using presto clusters. So most of the Presto functions are...","categories": ["AWS"],
        "tags": ["athena","automation","aws","lamba","python"],
        "url": "http://localhost:4000/automatically-create-aws-athena-partitions-for-cloudtrail-between-two-dates/"
      },{
        "title": "Automate AWS RedShift Snapshot And Restore",
        "excerpt":"Redshift will help to handle a massive data warehouse workload. I used to manage some redshift cluster in past. Whenever the developers or I wanted to test something on RedShift, we generally take a snapshot and then launch a new cluster or launch it from the automated snapshot. This is...","categories": ["AWS"],
        "tags": ["automation","aws","redshift","scripting","shell"],
        "url": "http://localhost:4000/automate-aws-redshift-snapshot-and-restore/"
      },{
        "title": "How To Convert MySQL Two Digit Year To Four Digit Year",
        "excerpt":"Today I was working with a small MySQL data set. The data provided by a CSV file and needed to load it into AWS RDS MySQL. Since the RDS does not support the Load data inline. So I have manually convert the CSV file to .sql file. But the problem statement...","categories": ["MySQL"],
        "tags": ["csv","datatype","mysql"],
        "url": "http://localhost:4000/convert-mysql-two-digit-year-to-four-digit-year/"
      },{
        "title": "MySQL GTID vs MariaDB GTID",
        "excerpt":"MySQL supports three types for binlog format. For safer binlog based replication its recommended to use ROW based replication. But even though in some worst cases this leads to data inconsistency. Later MySQL came up with the concept of GTID (global transaction identifiers) which generates the unique binlog entries to...","categories": ["MySQL"],
        "tags": ["mariadb","mysql","replication"],
        "url": "http://localhost:4000/mysql-gtid-vs-mariadb-gtid/"
      },{
        "title": "Internals Of Google DataStore And Technical Overview",
        "excerpt":"Google Cloud Platform provides many varieties of solutions. In Data world particularly in NoSQL technology Google provides Datastore a highly scalable and availability solution with ACID capabilities. I have read a lot about the Google Datastore and its Internals. Here Im going to merge everything as a single blog post....","categories": ["GCP"],
        "tags": ["bigtable","datastore","gcp","internals"],
        "url": "http://localhost:4000/internals-of-google-datastore-and-technical-overview/"
      },{
        "title": "Archive MySQL Data In Chunks Using Stored Procedure",
        "excerpt":"In a DBA’s day to day activities, we are doing Archive operation on our transnational database servers to improve your queries and control the Disk space. The archive is a most expensive operation since its involved a huge number of Read and Write will be performed. So its mandatory to run the...","categories": ["MySQL"],
        "tags": ["archive","automation","mysql","shell"],
        "url": "http://localhost:4000/archive-mysql-data-in-chunks/"
      },{
        "title": "RunDeck Series 1 - Install And Configure RunDeck 3.0 On CentOS 7",
        "excerpt":"I have done many automations MySQL Automations with Rundeck. This blog series will explain about the DevOps In MySQL with Rundeck. Rundeck is one of my favourite Automation tools. Here we are going to see how can we install and configure rundek on a CentOS server with mysql as a...","categories": ["Rundeck"],
        "tags": ["automation","centos","mysql","rundeck","rundeck series"],
        "url": "http://localhost:4000/rundeck-install-configure-centos-with-mysql/"
      },{
        "title": "RunDeck Series 2 - Add Nodes to the Rundeck",
        "excerpt":"Add nodes to the Rundeck Server is very next step after installation. Here we are going to see adding Linux nodes to Rundeck. After Rudeck 3.0+ the resources.xml file will not create automatically. In previous versions, this file was automatically created while creating a project. We’ll node nodes details in this...","categories": ["Rundeck"],
        "tags": ["automation","rundeck","rundeck series"],
        "url": "http://localhost:4000/add-nodes-to-the-rundeck/"
      },{
        "title": "RunDeck Series 3 - Configure Nginx ProxyPass For RunDeck",
        "excerpt":"RunDeck’s web GUI always run on port 4440. If we want to make it run on 80 then we need to do a custom installation. Since that’ll be a long process and its not applicable for existing RunDeck servers. In this blog, we are configuring nginx proxypass for Rundeck to make RunDeck web access on port...","categories": ["Rundeck"],
        "tags": ["automation","rundeck","rundeck series"],
        "url": "http://localhost:4000/configure-nginx-proxypass-for-rundeck/"
      },{
        "title": "RunDeck Series 4 - Configure RunDeck SMTP With AWS SES",
        "excerpt":"For any automations notification system is very important. Rundeck provides multiple integrations for job notifications. But SMTP is main for many users. In this blog, we are going to configure RunDeck SMTP with AWS SES. Tip:Configure Nginx ProxyPass For RunDeck AWS SES: AWS SES is a managed SMTP service. Go...","categories": ["Rundeck"],
        "tags": ["aws","rundeck","rundeck series","ses"],
        "url": "http://localhost:4000/configure-rundeck-smtp-with-aws-ses/"
      },{
        "title": "RunDeck Series 5 - Encrypt Key Files And Passwords In RunDeck",
        "excerpt":"While managing multi servers in a single place, we need a secure authentication method which includes SSH Keys, Passwords and etc. RunDeck is having a great feature called Key Storage. RunDeck Key Storage is a secure and encrypted place for storing confidential contents. Its using HashiCorp Vault for this. Its already...","categories": ["Rundeck"],
        "tags": ["automation","mysql","rundeck","rundeck series","security"],
        "url": "http://localhost:4000/encrypt-key-files-and-passwords-in-rundeck/"
      },{
        "title": "Automation Script For Percona Xtrabackup FULL/Incremental",
        "excerpt":"Image Source: DigitalOcean This is my first post in 2019, and Im starting with a MySQL solution. In MySQL world, implementing a better backup strategy to meet all of your requirement is still a challenging thing. The complexity depends on your RPO and RTO. Percona has many tools to help...","categories": ["MySQL"],
        "tags": ["backup","mysql","recovery","restore","xtrabackup","Backup and Recovery"],
        "url": "http://localhost:4000/automation-script-for-percona-xtrabackup-full-incremental/"
      },{
        "title": "AWS DocumentDB - A NoSQL Equivalent For Aurora",
        "excerpt":"As we all know that AWS announced the managed MongoDB services called as AWS DocumentDB. MongoDB is one of my favourite NoSQL Databases even for developers. Since Im working with MongoDB in AWS, its the very first step setting up the replica set and shards. It’ll take a couple of...","categories": ["AWS"],
        "tags": ["aurora","aws","documentdb","mongodb","nosql"],
        "url": "http://localhost:4000/aws-documentdb-a-nosql-equivalent-for-aurora/"
      },{
        "title": "Create Aurora Read Replica With AWS CLI/Lambda Python",
        "excerpt":"Today I was working for a scaleable solution in Aurora. Im going to publish that blog post soon in Searce Blog. As a part of this solution, I want to create Aurora read replicas programmatically. So we have done the create aurora read replica with AWS CLI and Lambda with...","categories": ["AWS"],
        "tags": ["aurora","aws","cli","lamba","mysql","python","rds"],
        "url": "http://localhost:4000/create-aurora-read-replica-aws-cli-lambda-python/"
      },{
        "title": "MySQL With DevOps 1 - Automate Database Archive",
        "excerpt":"This is my next blog series. Im going to write about how I automated many complex tasks in MySQL with Rundeck. In my last series, I have explained RunDeck basics. You can find those articles here. In this blog Im writing about how I automated MySQL archive for multiple tables...","categories": ["Rundeck"],
        "tags": ["archive","automation","devops","gcp","mysql","rundeck","shel"],
        "url": "http://localhost:4000/mysql-devops-automate-database-archive/"
      },{
        "title": "MySQL Exact Row Count For All The Tables",
        "excerpt":"Getting the row count from mysql tables are not a big deal and even there is no need for a blog for this. Simply go and query the INFORMATION_SCHEMA and get the row count for the tables. But this is not your actual row counts. It’ll show the row count...","categories": ["mysql"],
        "tags": ["mysql"," shellscript"],
        "url": "http://localhost:4000/mysql-exact-row-count-for-all-the-tables/"
      },{
        "title": "MySQL PITR The Fastest Way With DevOps",
        "excerpt":"Point In Time Recovery - is a nightmare for DBAs if the MySQL clusters are self managed. It was 10PM, after had my dinner I was simply watching some shows in YouTube. And my phone was ringing, the customer on other side. Due to some bad queries, one of the...","categories": ["MySQL"],
        "tags": ["mysql","automation","rundeck","backup and recovery","pitr","shellscript","GCP"],
        "url": "http://localhost:4000/mysql-pitr-the-fastest-way-with-devops/"
      },{
        "title": "Monitor Cassandra Clusters with Percona PMM - JMX Grafana and Prometheus",
        "excerpt":"While reading this title you may think about what this guy is going to do? Its all about JMX exporter from prometheus and Grafana. Yes, its already implemented by many companies and Grafana has some cool dashboards. But as a DBA, in Searce we are managing many customers and all...","categories": ["Cassandra"],
        "tags": ["cassandra","monitoring","grafana","prometheus"," percona"],
        "url": "http://localhost:4000/monitor-cassandra-clusters-with-percona-pmm-jmx-grafana-and-prometheus/"
      },{
        "title": "Database Mirroring is still a Mystery",
        "excerpt":"Database Mirroring - A replication feature which supports automatic failover and supported in standard as well. During SQL server 2016, Microsoft announced that Mirror will be removed from further releases. But still, its there and Documentations are showing it’s going to deprecate soon. The Alwayson Availability Groups is the permanent...","categories": ["SQLserver"],
        "tags": ["sqlserver","mirroring","migration","GCP","Backup"],
        "url": "http://localhost:4000/database-mirroring-is-still-a-mystery/"
      },{
        "title": "MongoDB Add Node To Replica Set Without Initial Sync In GCP/AWS",
        "excerpt":"Adding a new node to the MongoDB replica set with huge amount of data will take a lot of time to perform the initial sync. Recently I was working on a replica set where I need to replace all the nodes in the existing shard and add a new node...","categories": ["GCP","MongoDB"],
        "tags": ["gcp","mongodb","aws","snapshot","replication"],
        "url": "http://localhost:4000/mongodb-add-node-to-replica-set-without-initial-sync-in-gcp-aws/"
      },{
        "title": "MySQL Convert Binlog Based Replication To GTID Replication Without Downtime",
        "excerpt":"This title may be suitable for the new age MySQL Users. Because in 5.7 onwards its already supported to enable GTID online. But still few of my mission critical databases are in 5.6 and handling 70k QPS. So I know enabling GTID needs downtime for this. But in my case,...","categories": ["mysql"],
        "tags": ["mysql","replication","gtid"],
        "url": "http://localhost:4000/mysql-convert-binlog-based-replication-to-gtid-replication-without-downtime/"
      },{
        "title": "RedShift Unload to S3 With Partitions - Stored Procedure Way",
        "excerpt":"Redshift unload is the fastest way to export the data from Redshift cluster. In BigData world, generally people use the data in S3 for DataLake. So its important that we need to make sure the data in S3 should be partitioned. So we can use Athena, RedShift Spectrum or EMR...","categories": ["AWS"],
        "tags": ["aws","redshift","s3","sql"],
        "url": "http://localhost:4000/redshift-unload-to-s3-with-partitions-stored-procedure-way/"
      },{
        "title": "Relationalize Unstructured Data In AWS Athena with GrokSerDe",
        "excerpt":"Managing the logs in a centralized repository is one of the most common best practices in the DevOps world. Application logs, system logs, error logs, and any databases logs also will be pushed into your centralized repository. You can use ELK stack or Splunk to visualize the logs to get...","categories": ["AWS"],
        "tags": ["aws","athena","bigdata","Grok"],
        "url": "http://localhost:4000/relationalize-unstructured-data-in-aws-athena-with-grokserde/"
      },{
        "title": "CloudWatch Custom Log Filter Alarm For Kinesis Load Failed Event",
        "excerpt":"Kinesis Firehose is pushing the realtime data to S3, Redshift, ElasticSearch, and Splunk for realtime/Near real-time analytics. Sometime the target may not available due to maintenance or any reason. So the Kinesis will automatically push the data to S3 and create the manifest file in the errors directory. Then later...","categories": ["AWS"],
        "tags": ["aws","kinesis","cloudwatch","monitoring","redshift"],
        "url": "http://localhost:4000/cloudwatch-custom-log-filter-alarm-for-kinesis-load-failed-event/"
      },{
        "title": "How GCP Browser Based SSH Works",
        "excerpt":"If you are using GCP platform and lazy to setup VPN or bastion host, then you may familiar with using SSH connection via a browser. Yeah, its just one click to login to the Linux VM. Here are some questions for you. How many of you think how this actually...","categories": ["GCP"],
        "tags": ["gcp","ssh","security"],
        "url": "http://localhost:4000/how-gcp-browser-bases-ssh-works/"
      },{
        "title": "RedShift Unload All Tables To S3",
        "excerpt":"RedShift unload function will help us to export/unload the data from the tables to S3 directly. It actually runs a select query to get the results and them store them into S3. But unfortunately, it supports only one table at a time. You need to create a script to get...","categories": ["AWS"],
        "tags": ["aws","redshift","s3","sql"],
        "url": "http://localhost:4000/redshift-unload-all-tables-to-s3/"
      },{
        "title": "AWS Glue Custom Output File Size And Fixed Number Of Files",
        "excerpt":"AWS Glue is the serverless version of EMR clusters. Many organizations now adopted to use Glue for their day to day BigData workloads. I have written a blog in Searce’s Medium publication for Converting the CSV/JSON files to parquet using AWS Glue. Till now its many people are reading that...","categories": ["AWS"],
        "tags": ["aws","glue","parquet","s3"],
        "url": "http://localhost:4000/aws-glue-custom-output-file-size-and-fixed-number-of-files/"
      },{
        "title": "BackFill Failed Delivery From Kinesis To RedShift With Lambda",
        "excerpt":"If you are dealing with the realtime data stream from Kinesis to RedShift, then you may face this situation where Redshift was down due to some maintenance activity and kinesis firehose was not able to ingest the data. But it has awesome features to retry after the next 60 Minutes....","categories": ["AWS"],
        "tags": ["aws","kinesis","firehose","redshift","lambda","python"],
        "url": "http://localhost:4000/backfill-failed-delivery-from-kinesis-to-redshift-with-lambda/"
      },{
        "title": "MySQL Calculate How Much Disk Space You Wasted",
        "excerpt":"Its not the new term for DBAs. MySQL has an awesome parameter innodb-file-per-tables allows MySQL to create separate files for each tables. This helped a lot to manage the disk space in more efficient way. But when we perform a large batch job for delete or update the data in...","categories": ["MySQL"],
        "tags": ["mysql","shell","script","linux"],
        "url": "http://localhost:4000/mysql-calculate-how-much-disk-space-you-wasted/"
      },{
        "title": "Where GCP Internal TCP Load Balancer Fails",
        "excerpt":"GCP’s Load balancers are globally scalable and its the unique identify for GCP while comparing its competitors. Generally GCP’s networking is very strong and mature than other Cloud providers. Recently I was working with a SQL Server setup which integrates the GCP Internal TCP load balancer. During that PoC setup...","categories": ["GCP"],
        "tags": ["gcp","networking","load balancer"],
        "url": "http://localhost:4000/where-gcp-internal-load-balancer-fails/"
      },{
        "title": "Redshift Stored Procedure Comma separated string in Argument",
        "excerpt":"RedShift stored procedures are really useful feature and after a long time they introduced it. I tried this stored procedure for many use cases and recently I came up with a complexity in it. You can’t get a comma separated sting in the argument. Lets say I have an employee...","categories": ["AWS"],
        "tags": ["aws"," redshift","sql"],
        "url": "http://localhost:4000/redshift-stored-procedure-comma-separated-string-in-argument/"
      },{
        "title": "RedShift Unload Like A Pro - Multiple Tables And Schemas",
        "excerpt":"In my previous post, I explained how to unload all the tables in the RedShift database to S3 Bucket. But there was a limitation. We should export all the tables, you can’t specify some list of tables or all the tables in a specific schema. Its because of I can’t...","categories": ["AWS"],
        "tags": ["aws","redshift","unload","s3","sql"],
        "url": "http://localhost:4000/redshift-unload-multiple-tables-schema-to-s3/"
      },{
        "title": "Build Production Grade Debezium Cluster With Confluent Kafka",
        "excerpt":"We are living in the DataLake world. Now almost every organizations wants their reporting in Near Real Time. Kafka is of the best streaming platform for realtime reporting. Based on the Kafka connector, RedHat designed the Debezium which is an OpenSource product and high recommended for real time CDC from...","categories": ["Kafka"],
        "tags": ["aws","kafka","confluent","debezium","cdc","mysql","s3"],
        "url": "http://localhost:4000/build-production-grade-debezium-with-confluent-kafka-cluster/"
      },{
        "title": "Monitor Debezium MySQL Connector With Prometheus And Grafana",
        "excerpt":"Debezium is providing out of the box CDC solution from various databases. In my last blog post, I have published how to configure the Debezium MySQL connector. This is the next part of that post. Once we deployed the debezium, to we need some kind of monitoring to keep track...","categories": ["Kafka"],
        "tags": ["Kafka","grafana","prometheus","debezium","mysql","jmx","monitoring"],
        "url": "http://localhost:4000/monitor-debezium-mysql-connector-with-prometheus-and-grafana/"
      },{
        "title": "RedShift Kill All Locking Sessions On A Table",
        "excerpt":"In any relational database, if you didn’t close the session properly, then it’ll lock your DDL queries. It’s applicable to RedShift as well. A few days back I got a scenario that we have to run some DROP TABLE commands to create some lookup tables. But every time while triggering...","categories": ["RedShift"],
        "tags": ["aws","redshift","sql"],
        "url": "http://localhost:4000/redshift-kill-all-locking-sessions-on-a-table/"
      },{
        "title": "Debezium MySQL Snapshot From Read Replica With GTID",
        "excerpt":"When you installed the Debezium MySQL connector, then it’ll start read your historical data and push all of them into the Kafka topics. This setting can we changed via snapshot.mode parameter in the connector. But if you are going to start a new sync, then Debezium will load the existing...","categories": ["Kafka"],
        "tags": ["kafka","debezium","mysql"],
        "url": "http://localhost:4000/debezium-mysql-snapshot-from-read-replica-with-gtid/"
      },{
        "title": "Debezium MySQL Snapshot From Read Replica And Resume From Master",
        "excerpt":"In my previous post, I have shown you how to take the snapshot from Read Replica with GTID for Debezium MySQL connector. GTID concept is awesome, but still many of us using the replication without GTID. For these cases, we can take a snapshot from Read replica and then manually...","categories": ["Kafka"],
        "tags": ["kafka","mysql","debezium","replication"],
        "url": "http://localhost:4000/debezium-mysql-snapshot-from-read-replica-and-resume-from-master/"
      },{
        "title": "Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot",
        "excerpt":"I have published enough Debezium MySQL connector tutorials for taking snapshots from Read Replica. To continue my research I wanted to do something for AWS RDS Aurora as well. But aurora is not using binlog bases replication. So we can’t use the list of tutorials that I published already. In...","categories": ["Kafka"],
        "tags": ["aws","rds","aurora","kafka","debezium"],
        "url": "http://localhost:4000/debezium-mysql-snapshot-for-aws-rds-aurora-from-backup-snaphot/"
      }]
