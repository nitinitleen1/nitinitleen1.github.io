---
title: Debezium MySQL Snapshot From Read Replica With GTID
date: 2019-12-28 11:17:00 +0000
description: Take Debezium mysql connector snapshot from read replica using GTID.
  You can use this method to sync historical data for Debezium using read replica.
categories:
- Kafka
tags:
- kafka
- debezium
- mysql
image: "/assets/Debezium MySQL Snapshot From Read Replica With GTID.jpg"

---
When you installed the Debezium MySQL connector, then it'll start read your historical data and push all of them into the Kafka topics. This setting can we changed via `snapshot.mode` parameter in the connector. But if you are going to start a new sync, then Debezium will load the existing data its called Snapshot. Unfortunately, if you have a busy transactional MySQL database, then it may lead to some performance issues. And your DBA will never agree to read the data from Master Node.\[Disclaimer: I'm a DBA :) \]. So I was thinking of figuring out to take the snapshot from the Read Replica, once the snapshot is done, then start read the realtime data from the Master. I found this useful information in a StackOverflow answer.

> If your binlog uses GTID, you should be able to make a CDC tool like Debezium read the snapshot from the replica, then when that's done, switch to the master to read the binlog. But if you don't use GTID, that's a little more tricky. The tool would have to know the binlog position on the master corresponding to the snapshot on the replica.
>
> **Source**: [https://stackoverflow.com/a/58250791/6885516](https://stackoverflow.com/a/58250791/6885516 "https://stackoverflow.com/a/58250791/6885516")

Then I tried to implement in a realtime scenario and verified the statement is true. Yes, we made this in our system. Here is the step by step details from our PoC.

## Requirements:

* Master and Slave should be enabled with GTID.
* Debezium Connector Node can talk to both master and slave.
* `log-slave-updates` must be enabled on the slave(anyhow for GTID its requires).
* A user account for Debezium with respective permissions.
* Install Debezium connector.

## Sample data:

Create a new database to test this sync and insert some values.
{% highlight sql %}
create database bhuvi;
use bhuvi;
create table rohi (
id int,
fn varchar(10),
ln varchar(10),
phone int);

insert into rohi values (1, 'rohit', 'last',87611);
insert into rohi values (2, 'rohit', 'last',87611);
insert into rohi values (3, 'rohit', 'last',87611);
insert into rohi values (4, 'rohit', 'last',87611);
insert into rohi values (5, 'rohit', 'last',87611);
{% endhighlight %}

### Create the MySQL Connector Config:

File Name: mysql.json
{% highlight JSON %}
{
    "name": "mysql-connector-db01",
    "config": {
        "name": "mysql-connector-db01",
        "connector.class": "io.debezium.connector.mysql.MySqlConnector",
        "database.server.id": "1",
        "tasks.max": "1",
        "database.history.kafka.bootstrap.servers": "YOUR-BOOTSTRAP-SERVER:9092",
        "database.history.kafka.topic": "schema-changes.mysql",
        "database.server.name": "mysql-db01",
        "database.hostname": "IP-OF-READER-NODE",
        "database.port": "3306",
        "database.user": "bhuvi",
        "database.password": "****",
        "database.whitelist": "bhuvi",
        "snapshot.mode": "initial",
        "snapshot.locking.mode": "none",
        "key.converter": "org.apache.kafka.connect.json.JsonConverter",
        "value.converter": "org.apache.kafka.connect.json.JsonConverter",
        "key.converter.schemas.enable": "false",
        "value.converter.schemas.enable": "false",
        "internal.key.converter": "org.apache.kafka.connect.json.JsonConverter",
        "internal.value.converter": "org.apache.kafka.connect.json.JsonConverter",
        "internal.key.converter.schemas.enable": "false",
        "internal.value.converter.schemas.enable": "false",
        "transforms": "unwrap",
       	"transforms.unwrap.add.source.fields": "ts_ms",
  		"tombstones.on.delete": "false",
  		"transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState
    }
}
{% endhighlight %}

### Watch the status of the connector:

Open three terminal windows and start listening to the following topics.

NOTE: change the bootstrap-server as per your cluster's IP.

1. connect-configs
2. connect-status

{% highlight shell %}
From Terminal-1
kafka-console-consumer --bootstrap-server localhost:9092 --topic connect-configs --from-beginning
From Terminal-2
kafka-console-consumer --bootstrap-server localhost:9092 --topic connect-status --from-beginning
{% endhighlight %}

### Install the Connector:
{% highlight shell %}
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:8083/connectors -d @mysql.json
{% endhighlight %}

Once you installed, from your `connect-configs` topic, you will get the following output.
{% highlight shell %}
{"properties":{"connector.class":"io.debezium.connector.mysql.MySqlConnector","snapshot.locking.mode":"none","database.user":"bhuvi","database.server.id":"1""tasks.max":"1","database.history.kafka.bootstrap.servers":"172.31.40.132:9092","database.history.kafka.topic":"schema-changes.mysql""database.server.name":"mysql-db01","internal.key.converter.schemas.enable":"false","database.port":"3306","key.converter.schemas.enable":"false""internal.key.converter":"org.apache.kafka.connect.json.JsonConverter","task.class":"io.debezium.connector.mysql.MySqlConnectorTask""database.hostname":"172.31.25.99","database.password":"*****","internal.value.converter.schemas.enable":"false","name":"mysql-connector-db01""value.converter.schemas.enable":"false","internal.value.converter":"org.apache.kafka.connect.json.JsonConverter""value.converter":"org.apache.kafka.connect.json.JsonConverter","database.whitelist":"bhuvi","key.converter":"org.apache.kafka.connect.json.JsonConverter""snapshot.mode":"initial"}}
{"tasks":1}
{% endhighlight %}

And then from your `connect-status`topic, you'll get the status of your MySQL connector.
{% highlight json %}
{"state":"RUNNING","trace":null,"worker_id":"172.31.36.115:8083","generation":2}
{"state":"RUNNING","trace":null,"worker_id":"172.31.36.115:8083","generation":3}
{% endhighlight %}

### Snapshot Status from the log file:

By default, the Kafka connector's logs will go to syslog. You can customize this log location. So wherever you have the log file, you can see the snapshot progress there.
{% highlight shell %}
[2019-12-28 11:06:04,246] INFO Step 7: scanning contents of 1 tables while still in transaction (io.debezium.connector.mysql.SnapshotReader)
[2019-12-28 11:06:04,252] INFO Step 7: - scanning table 'bhuvi.rohi' (1 of 1 tables) (io.debezium.connector.mysql.SnapshotReader)
[2019-12-28 11:06:04,252] INFO For table 'bhuvi.rohi' using select statement: 'SELECT * FROM `bhuvi`.`rohi`' (io.debezium.connector.mysql.SnapshotReader)
[2019-12-28 11:06:04,264] INFO Step 7: - Completed scanning a total of 31 rows from table 'bhuvi.rohi' after 00:00:00.012(io.debezium.connector.mysql.SnapshotReader)
[2019-12-28 11:06:04,265] INFO Step 7: scanned 5 rows in 1 tables in 00:00:00.018 (io.debezium.connector.mysql.SnapshotReader)
[2019-12-28 11:06:04,265] INFO Step 8: committing transaction (io.debezium.connector.mysql.SnapshotReader)
[2019-12-28 11:06:04,267] INFO Completed snapshot in 00:00:01.896 (io.debezium.connector.mysql.SnapshotReader)
[2019-12-28 11:06:04,348] WARN [Producer clientId=connector-producer-mysql-connector-db01-0] Error while fetching metadata with correlation id 7 :{mysql-db01.bhuvi.rohi=LEADER_NOT_AVAILABLE} (org.apache.kafka.clients.NetworkClient)
[2019-12-28 11:06:04,460] INFO Transitioning from the snapshot reader to the binlog reader (io.debezium.connector.mysql.ChainedReader)
[2019-12-28 11:06:04,492] INFO GTID set purged on server: 88726004-2734-11ea-ae86-0e7687279b85:1-7 (io.debezium.connector.mysql.BinlogReader)
[2019-12-28 11:06:04,492] INFO Attempting to generate a filtered GTID set (io.debezium.connector.mysql.MySqlTaskContext)
[2019-12-28 11:06:04,492] INFO GTID set from previous recorded offset: 88726004-2734-11ea-ae86-0e7687279b85:1-11(io.debezium.connector.mysql.MySqlTaskContext)
[2019-12-28 11:06:04,492] INFO GTID set available on server: 88726004-2734-11ea-ae86-0e7687279b85:1-11 (io.debezium.connector.mysql.MySqlTaskContext)
[2019-12-28 11:06:04,492] INFO Final merged GTID set to use when connecting to MySQL: 88726004-2734-11ea-ae86-0e7687279b85:1-11(io.debezium.connector.mysql.MySqlTaskContext)
[2019-12-28 11:06:04,492] INFO Registering binlog reader with GTID set: 88726004-2734-11ea-ae86-0e7687279b85:1-11 (io.debezium.connector.mysql.BinlogReader)
{% endhighlight %}

## Snapshot Complete:

Once your' snapshot process is done, then the `connect-offsets` topic will have the binlog information of till where it's consumed.
{% highlight shell %}
{"file":"ip-172-31-25-99-bin.000001","pos":1234,"gtids":"88726004-2734-11ea-ae86-0e7687279b85:1-11"}
{% endhighlight %}

Then it'll start applying the ongoing replication changes as well.
{% highlight shell %}
{"ts_sec":1577531225,"file":"ip-172-31-25-99-bin.000001","pos":1299,"gtids":"88726004-2734-11ea-ae86-0e7687279b85:1-11","row":1,"server_id":1,"event":2}
{% endhighlight %}

Now we have verified that the database's snapshot has been done. Its time to swap the nodes. We'll start consuming from the Master.

If you enable the Monitoring for the Debezium connector, then you see the lag from the JMX or Premetheus metrics. 

**Reference**: [Configuring monitoring for Debezium MySQL Connector](https://thedataguy.in/monitor-debezium-mysql-connector-with-prometheus-and-grafana/).
{% highlight shell %}
curl localhost:7071 | grep debezium_metrics_SecondsBehindMaster
debezium_metrics_SecondsBehindMaster{context="binlog",name="mysql-db01",plugin="mysql",} 299.577536699E9
{% endhighlight %}

Sometimes the metrics take a few more minutes to update. So once you are able to see the last binlog information from the `connet-offsets` and the `lag <10`, then the snapshot is done. 

## Switch to Master:

The main important thing is to STOP the slave thread in your Read replica. This will prevent the changing the GTID in your `connect-offsets` topic.
{% highlight sql %} 
mysql-slave> STOP SLAVE;
{% endhighlight %}

To simulate the sync, we can add 1 new row in our MySQL table.  So this will never replicate to your slave. But once you switch the node, it should start reading from this row.
{% highlight shell %}
mysql-master> insert into rohi values (6, 'rohit', 'last','87611');
{% endhighlight %}

We need to update the existing MySQL connector's config and just change the `"database.hostname"` parameter.

> **Note**: this JSON file format is different from the one which we used to register the connector. So make sure the syntax.

**_File Name_**: mysql-update.json

{% highlight json %}
{
	"connector.class": "io.debezium.connector.mysql.MySqlConnector",
	"snapshot.locking.mode": "none",
	"tasks.max": "3",
	"database.history.kafka.topic": "schema-changes.mysql",
	"transforms": "unwrap",
	"internal.key.converter.schemas.enable": "false",
	"transforms.unwrap.add.source.fields": "ts_ms",
	"tombstones.on.delete": "false",
	"transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
	"value.converter": "org.apache.kafka.connect.json.JsonConverter",
	"database.whitelist": "bhuvi",
	"key.converter": "org.apache.kafka.connect.json.JsonConverter",
	"database.user": "bhuvi",
	"database.server.id": "1",
	"database.history.kafka.bootstrap.servers": "YOUR-KAFKA-BOOTSTRAP-SERVER:9092",
	"database.server.name": "mysql-db01",
	"database.port": "3306",
	"key.converter.schemas.enable": "false",
	"internal.key.converter": "org.apache.kafka.connect.json.JsonConverter",
	"database.hostname": "MASTER-IP-ADDRESS",
	"database.password": "****",
	"internal.value.converter.schemas.enable": "false",
	"name": "mysql-connector-db01",
	"value.converter.schemas.enable": "false",
	"internal.value.converter": "org.apache.kafka.connect.json.JsonConverter",
	"snapshot.mode": "initial"
}
{% endhighlight %}

Run the below command to update the config file.


{% highlight shell %}
curl -X PUT -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:8083/connectors/mysql-connector-db01/config -d @mysql-update.json
{% endhighlight %}

Once its updated, from the `connect-offsets` topic, you can see that the Debezium starts reading the data from the Next GTID.
{% highlight json %}
{"ts_sec":1577531276,"file":"mysql-bin.000008","pos":1937,"gtids":"88726004-2734-11ea-ae86-0e7687279b85:1-13","row":1,"server_id":1,"event":2}
{% endhighlight %}

Also from your topic, you can see the last row has been pushed.
{% highlight shell %}
kafka-console-consumer --bootstrap-server localhost:9092 --topic mysql-db01.bhuvi.rohi --from-beginning
    
{"id":1,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":2,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":3,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":4,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":5,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":6,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":1577531276000}
{% endhighlight %}

This method helped us to sync the historical data from the Read replica to the Kafka topic without affecting the transactions on the Master node. Still, we are exploring this for more scenarios.  I'll keep posting new articles about this.  

### Debezium Series blogs:

1. [Build Production Grade Debezium Cluster With Confluent Kafka](https://thedataguy.in/build-production-grade-debezium-with-confluent-kafka-cluster/)
2. [Monitor Debezium MySQL Connector With Prometheus And Grafana](https://thedataguy.in/monitor-debezium-mysql-connector-with-prometheus-and-grafana/)
3. [Debezium MySQL Snapshot From Read Replica With GTID](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-with-gtid/)
4. [Debezium MySQL Snapshot From Read Replica And Resume From Master](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-and-resume-from-master/)
5. [Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot](https://thedataguy.in/debezium-mysql-snapshot-for-aws-rds-aurora-from-backup-snaphot/)
6. [RealTime CDC From MySQL Using AWS MSK With Debezium](https://medium.com/searce/realtime-cdc-from-mysql-using-aws-msk-with-debezium-28da5a4ca873)