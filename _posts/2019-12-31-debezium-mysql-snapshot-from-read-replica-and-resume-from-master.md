---
title: Debezium MySQL Snapshot From Read Replica And Resume From Master
date: 2019-12-31T12:10:00.000+00:00
description: Debezium MySQL connector to take snapshot from Read replica and then
  point it to the Master node without GTID. We can resume the CDC with binlog information
  from slave status.
categories:
- Kafka
tags:
- kafka
- mysql
- debezium
- replication
image: "/assets/Debezium MySQL Snapshot From Read Replica Without GTID - Custom Binlog.jpg"

---
In my [previous post](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-with-gtid/), I have shown you how to take the snapshot from Read Replica with GTID for Debezium  MySQL connector. GTID concept is awesome, but still many of us using the replication without GTID. For these cases, we can take a snapshot from Read replica and then manually push the Master binlog information to the offsets topic. Injecting manual entry for offsets topic is [already documented in Debezium](https://debezium.io/documentation/faq/#how_to_change_the_offsets_of_the_source_database). I'm just guiding you the way to take snapshot from Read replica without GTID.

## Requirements:

* Setup master slave replication.
* The slave must have `log-slave-updates=ON` else connector will fail to read from beginning onwards.
* Debezium connector should be able to access the Read replica with a user that is having necessary permissions.
* Install Debezium connector.

## Use a different name for Slave binlog:

> **Note**: If you are already having a Master slave setup then ignore this step.

By default, MySQL use `mysql-bin` as a prefix for all the mysql binlog files. We should not have the same binlog name for both the master and the slave. If you are setting up a new master-slave replication then make this change in `my.cnf` file.

{% highlight shell %}
master#
log_bin = /var/log/mysql/mysql-bin.log
slave#
log_bin = /var/log/mysql/mysql-slave-bin.log
{% endhighlight %}

## Sample data:

Create a new database to test this sync and insert some values.
{% highlight shell %}
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
{% highlight json %}
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

Run the below command to register the mysql connector.
{% highlight shell %}
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:8083/connectors -d @mysql.json
{% endhighlight %}

Once the snapshot has been done, then it'll push the binlog information of the Slave while taking the snapshot. And then it'll start to continue to do CDC for the upcoming data. You will see the first record in your `connect-offsets` topic as like below.
{% highlight shell %}
{"file":"ip-172-31-25-99-bin.000002","pos":7240}
{% endhighlight %}

Then for continuous replication, it'll start adding the record to this topic along with some more addition metadata like, server id, timestamp.
{% highlight shell %}
{"ts_sec":1577764293,"file":"ip-172-31-25-99-bin.000002","pos":7305,"row":1,"server_id":1,"event":2}
{% endhighlight %}

You can monitor the snapshot progress from JMX.
{% highlight shell %}
curl localhost:7071 | grep debezium_metrics_SecondsBehindMaster
debezium_metrics_SecondsBehindMaster{context="binlog",name="mysql-db01",plugin="mysql",} 299.577536699E9
{% endhighlight %}

Sometimes the metrics take a few more minutes to update. So once you are able to see the last binlog information from the `connet-offsets` and from JMX the `lag <10`, then the snapshot is done.

## Switch to Master:

Before switching to the master, we need to stop the slave instance to get the consistent binlog information of Master from the Read replica. And then stop the Debezium connector to update binlog information manually in the `connect-offsets` topic.
{% highlight sql %}
mysql-slave> stop slave;
{% endhighlight %}

{% highlight shell %}
Debezium-connector-node# systemctl stop confluent-connect-distributed
{% endhighlight %}

To simulate the real-time scenario, we can add 1 new row in our MySQL table. So this will never replicate to your slave. But once you switch the node, it should start reading from this row.
{% highlight sql %}
mysql-master> insert into rohi values (6, 'rohit', 'last','87611');
{% endhighlight %}

Also create a new table and insert one new row to this new table.
{% highlight sql %}
mysql-master> create table testtbl (id int);
mysql-master> insert into testtbl values (1);
{% endhighlight %}

Once the switchover has been done, then it should read the `6'th row` that we inserted and a new topic should be created for the `testtbl`

## Get the last binlog info from offsets:

Install `kafkacat` in you broker node. (it's available from [confluent repo](https://docs.confluent.io/current/app-development/kafkacat-usage.html))
{% highlight shell %}
apt-get install kafkacat
{% endhighlight %}

Run the below command get the last read binlog info.
{% highlight shell %}
kafkacat -b localhost:9092 -C -t connect-offsets  -f 'Partition(%p) %k %s\n'
{% endhighlight %}

* **-b** - Broker
* **-C** consumer
* **-t** Topic
* **-f** lag takes arguments specifying both the format of the output and the fields to include.

You will get something like this.
{% highlight shell %}
Partition(0) ["mysql-connector-db01",{"server":"mysql-db01"}] {"file":"ip-172-31-25-99-bin.000002","pos":7240}
Partition(0) ["mysql-connector-db01",{"server":"mysql-db01"}] {"ts_sec":1577764293,"file":"ip-172-31-25-99-bin.000002","pos":7305,"row":1,"server_id":1,"event":2}
{% endhighlight %}

* `Partition(0)` - The Partition where the information is location.
* `mysql-connector-db01`  Connector Name
* `"server":"mysql-db01"` Server name that the connect has.
* `"ts-sec":1577764293,"file":"ip-172-31-25-99-bin.000002","pos":7305,"row":1,"server_id":1,"event":2` - Binlog information

Now we'll manually push a new record inside this topic with the same information but just replace the binlog file name and its position. We need to continue the CDC where it stopped, so the get the exact starting binlog information we'll use `slave status` from the Read replica.
{% highlight sql %}
mysql-slave> show slave status\G

                   Slave_IO_State:
                      Master_Host: 172.31.36.115
                      Master_User: bhuvi
                      Master_Port: 3306
                    Connect_Retry: 60
                  Master_Log_File: mysql-bin.000003
              Read_Master_Log_Pos: 7759
                   Relay_Log_File: ip-172-31-25-99-relay-bin.000009
                    Relay_Log_Pos: 7646
              Exec_Master_Log_Pos: 7759

{% endhighlight %}

Make a note of `Master-log-file` and `Exec-Master-Log-Pos` from the slave status. Now inject a new record to the offets topic.

{% highlight shell %}
echo '["mysql-connector-db01",{"server":"mysql-db01"}]|{"file":"mysql-bin.000003","pos":7759}' |   
kafkacat -P -b localhost:9092 -t connect-offsets -K | -p 0
{% endhighlight %}

* **-b** Broker
* **-P** Producer
* **-K** Delimiter
* **-p** Partition

If you read the data from this topic, you'll see the manually injected record.
{% highlight shell %}
kafka-console-consumer --bootstrap-server localhost:9092 --topic connect-offsets --from-beginning

{"file":"ip-172-31-25-99-bin.000002","pos":7240}
{"ts_sec":1577764293,"file":"ip-172-31-25-99-bin.000002","pos":7305,"row":1,"server_id":1,"event":2}
{"file":"mysql-bin.000003","pos":7759}
{% endhighlight %}

Once you start the Debezium MySQL connector, then it'll start reading from the slave but it'll start looking for the binlog file `mysql-bin.000003` If you use the same binlog file name for both master and slave, then it'll be a problem. So we can do any one of the following method to solve this.

1. Use different naming conversion for both Master and Slave binlog files.
2. Delete all the binlog files from the Slave using `Reset master` command.
3. If the binlog file in slave is having a file named as `mysql-bin.000003` then delete this file alone.
4. If the binlog file in slave is having a file names as `mysql-bin.000003` then rename this file as `mysql-bin.000003.old`

> **Disclaimer**: Please consider with your DBA before performing any of the above steps. I recommend using step 1 or 4.

### Start the debezium connector:

{% highlight shell %}
Debezium-connector-node#  systemctl start confluent-connect-distributedv
{% endhighlight %}

You in your connector log file, you can see there is an error indicating that the Debezium is not able to find the binlog file called `mysql-bin.000003`.
{% highlight shell %}
\[2019-12-31 03:55:17,128\] INFO WorkerSourceTask{id=mysql-connector-db01-0} flushing 0 outstanding messages for offset commit (org.apache.kafka.connect.runtime.WorkerSourceTask)
\[2019-12-31 03:55:17,131\] ERROR WorkerSourceTask{id=mysql-connector-db01-0} Task threw an uncaught and unrecoverable exception (org.apache.kafka.connect.runtime.WorkerTask)
org.apache.kafka.connect.errors.ConnectException: The connector is trying to read binlog starting at binlog file 'mysql-bin.000003', pos=7759, skipping 2 events plus 1 rows, but this is no longer available on the server. Reconfigure the connector to use a snapshot when needed.
at io.debezium.connector.mysql.MySqlConnectorTask.start(MySqlConnectorTask.java:132)
at io.debezium.connector.common.BaseSourceTask.start(BaseSourceTask.java:49)
at org.apache.kafka.connect.runtime.WorkerSourceTask.execute(WorkerSourceTask.java:208)
at org.apache.kafka.connect.runtime.WorkerTask.doRun(WorkerTask.java:177)
at org.apache.kafka.connect.runtime.WorkerTask.run(WorkerTask.java:227)
at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:515)
at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
at java.base/java.lang.Thread.run(Thread.java:834)
\[2019-12-31 03:55:17,132\] ERROR WorkerSourceTask{id=mysql-connector-db01-0} Task is being killed and will not recover until manually restarted (org.apache.kafka.connect.runtime.WorkerTask)
\[2019-12-31 03:55:17,132\] INFO Stopping MySQL connector task (io.debezium.connector.mysql.MySqlConnectorTask)
{% endhighlight %}

Now we need to update the existing MySQL connector’s config and just change the `"database.hostname"` parameter.

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

Once the update is done, immediately it'll start connecting to the master and start reading the binlog file `mysql-bin.000003` from position `7759`.

We inserted a new record to the `rohi` table. If you read this topic then you can see the row has been read. Also start inserting few more rows to this table with id 7 and 8.
{% highlight shell %}
kafka-console-consumer --bootstrap-server localhost:9092 --topic mysql-db01.bhuvi.rohi --from-beginning

{"id":6,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":1577788740000}
{"id":7,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":1577788764000}
{"id":8,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":1577788767000}
{% endhighlight %}

Also, it should added the `testtbl` to the kafka topic.
{% highlight shell %}
kafka-topics --zookeeper localhost:2181 --list

connect-configs
connect-offsets
connect-status
default_ksql_processing_log
my_connect_offsets
mysql-db01
mysql-db01.bhuvi.rohi
mysql-db01.bhuvi.testtbl
schema-changes.mysql
{% endhighlight %}

Once your switchover is done, resume the replication on your slave.

### Debezium Series blogs:

1. [Build Production Grade Debezium Cluster With Confluent Kafka](https://thedataguy.in/build-production-grade-debezium-with-confluent-kafka-cluster/)
2. [Monitor Debezium MySQL Connector With Prometheus And Grafana](https://thedataguy.in/monitor-debezium-mysql-connector-with-prometheus-and-grafana/)
3. [Debezium MySQL Snapshot From Read Replica With GTID](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-with-gtid/)
4. [Debezium MySQL Snapshot From Read Replica And Resume From Master](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-and-resume-from-master/)
5. [Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot](https://thedataguy.in/debezium-mysql-snapshot-for-aws-rds-aurora-from-backup-snaphot/)
6. [RealTime CDC From MySQL Using AWS MSK With Debezium](https://medium.com/searce/realtime-cdc-from-mysql-using-aws-msk-with-debezium-28da5a4ca873)