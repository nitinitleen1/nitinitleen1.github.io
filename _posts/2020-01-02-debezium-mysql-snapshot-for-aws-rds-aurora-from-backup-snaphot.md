---
title: Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot
date: 2020-01-02 14:13:00 +0530
description: Debezium MySQL connector load historical data of AWS RDS Aurora from
  its snapshot. Using crash recovery, we can get the binlog information.
categories:
- Kafka
tags:
- aws
- rds
- aurora
- kafka
- debezium
image: "/assets/Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot.jpg"

---
I have published enough Debezium MySQL connector tutorials for taking snapshots from Read Replica. To continue my research I wanted to do something for AWS RDS Aurora as well. But aurora is not using binlog bases replication. So we can't use the list of tutorials that I published already. In Aurora, we can get the binlog file name and its position from its snapshot of the source Cluster. So I used a snapshot for loading the historical data, and once it's loaded we can resume the CDC from the main cluster.

## Requirements:

1. Running aurora cluster.
2. Aurora cluster must have [binlogs enabled](https://aws.amazon.com/premiumsupport/knowledge-center/enable-binary-logging-aurora/).
3. Make binlog retention period to a minimum 3 days(its a best practice).
4. Debezium connector should be able to access both the clusters.
5. Make sure you have different security groups for the main RDS Aurora cluster and the Snapshot cluster.

## Sample data in source aurora:

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

## Take Aurora snapshot:

Go to the RDS console and select your source Aurora master node. Take a snapshot of it. Once the snapshot has been done, you see that in the snapshots tab.

![](/assets/Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot1.jpg)

## New cluster from snapshot:

Then create a new cluster from the snapshot. Once its launched, we can get the binlog info from the logs.

In RDS Console, select the instance name. Click on the Logs & Events tab. Below the Recent events, you can see the binlog information of the source Aurora node while talking the snapshot. This cluster also needs to enable with binlog.

![](/assets/Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot2.jpg)

## Register the MySQL Connector:

Follow this link to [configure Kafka cluster and connector.](https://thedataguy.in/build-production-grade-debezium-with-confluent-kafka-cluster/) Create a file called `mysql.json` and add the Snapshot cluster's information.
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
"database.hostname": "SNAPSHOT-INSTANCE-ENDPOINT",
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
"transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState"
}
}
{% endhighlight %}

Run the below command to register it on the connector node.
{% highlight shell %}
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:8083/connectors -d @mysql.json
{% endhighlight %}

Once the snapshot has been done, you can see the snapshot cluster's current binlog file name and its position in the `connect-offsets` topic.
{% highlight shell %}
kafka-console-consumer --bootstrap-server localhost:9092 --topic connect-offsets --from-beginning

{"file":"mysql-bin-changelog.000006","pos":154}
{% endhighlight %}

## Add more data on the source Cluster:

To simulate the real production setup, add few more rows to the `rohi` table.
{% highlight sql %}
insert into rohi values (6, 'rohit', 'last',87611);
insert into rohi values (7, 'rohit', 'last',87611);
{% endhighlight %}

Also, create a new table.
{% highlight sql %}
use bhuvi;
create table testtbl (id int);
insert into testtbl values (1);
{% endhighlight %}

Because, once we switch to the source cluster, it should read these new data.

## Update the Source Aurora binlog info:

Stop the connector service and manually inject the binlog information that we got from the Snapshot cluster's Log & Events section.
{% highlight shell %}
connector-node# systemctl stop confluent-connect-distributed
{% endhighlight %}

Get the last read binlog information and its parition from the `connect-offsets` topic.
{% highlight shell %}
kafkacat -b localhost:9092 -C -t connect-offsets  -f 'Partition(%p) %k %s\\n'

Partition(0) \["mysql-connector-db01",{"server":"mysql-db01"}\] {"file":"mysql-bin-changelog.000006","pos":154}
{% endhighlight %}

* `kafkacat` - command-line utility from confluent.
* `-b localhost:9092`  - broker details
* `-C` - Consumer
* `-t connect-offsets` - topic
* `Partition(0)` - The partition name where we have the binlog info.
* `mysql-connector-db01` - connector name
* `"server":"mysql-db01` - server name we used in `mysql.json` file

Run the following command to inject the binlog info to the `connect-offsets` topic.
{% highlight shell %}
echo '\["mysql-connector-db01",{"server":"mysql-db01"}\]|{"file":"mysql-bin-changelog.000002","pos":2170}' | \\  
kafkacat -P -b localhost:9092 -t connect-offsets -K | -p 0
{% endhighlight %}

* `mysql-connector-db01` - connector name
* `"server":"mysql-db01` - server name we used in `mysql.json` file
* `{"file":"mysql-bin-changelog.000002","pos":2170}` - Binlog info from the snapshot cluster's log.
* `kafkacat` - command-line utility from confluent.
* `-P` - Producer
* `-b localhost:9092`  - broker details
* `-t connect-offsets` - topic
* `-p 0` Partition where we have the binlog info.

Now if you read the data from the consumer, it'll show the new binlog.
{% highlight shell %}
kafka-console-consumer --bootstrap-server localhost:9092 --topic connect-offsets --from-beginning

{"file":"mysql-bin-changelog.000006","pos":154}
{"file":"mysql-bin-changelog.000002","pos":2170}
{% endhighlight %}

## Switch to Source Cluster:

Before doing the switchover, we need to make that the connector should not access to the snapshot cluster once the connector service started. We can achieve this in 2 ways.

1. Anyhow, we read all the from the snapshot cluster, so delete it.
2. In the Snapshot cluster's security group, remove the connector's node IP.

I recommend using the 2nd option. Now start the connector service. After a few seconds, you can see the logs like below.
{% highlight shell %}
\[2020-01-02 06:57:21,448\] INFO Starting MySqlConnectorTask with configuration: (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,450\] INFO    connector.class = io.debezium.connector.mysql.MySqlConnector (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,450\] INFO    snapshot.locking.mode = none (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,451\] INFO    tasks.max = 1 (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,451\] INFO    database.history.kafka.topic = replica-schema-changes.mysql (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,452\] INFO    transforms = unwrap (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,452\] INFO    internal.key.converter.schemas.enable = false (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,452\] INFO    transforms.unwrap.add.source.fields = ts_ms (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    tombstones.on.delete = false (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    transforms.unwrap.type = io.debezium.transforms.ExtractNewRecordState (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    value.converter = org.apache.kafka.connect.json.JsonConverter (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    database.whitelist = bhuvi (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    key.converter = org.apache.kafka.connect.json.JsonConverter (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    database.user = admin (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    database.server.id = 1 (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    database.history.kafka.bootstrap.servers = 172.31.40.132:9092 (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    database.server.name = mysql-db01 (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,453\] INFO    database.port = 3306 (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    key.converter.schemas.enable = false (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    internal.key.converter = org.apache.kafka.connect.json.JsonConverter (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    task.class = io.debezium.connector.mysql.MySqlConnectorTask (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    database.hostname = snapshot-cluster.cluster-chbcar19iy5o.us-east-1.rds.amazonaws.com (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    database.password = ******** (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    internal.value.converter.schemas.enable = false (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    name = mysql-connector-db01 (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    value.converter.schemas.enable = false (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    internal.value.converter = org.apache.kafka.connect.json.JsonConverter (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,454\] INFO    snapshot.mode = initial (io.debezium.connector.common.BaseSourceTask)
\[2020-01-02 06:57:21,512\] INFO \[Producer clientId=connector-producer-mysql-connector-db01-0\] Cluster ID: H-jsdNk9SUuud35n3AIk8g (org.apache.kafka.clients.Metadata)
{% endhighlight %}

### Update the Endpoint:

Create an updated config file which has the endpoint of Source Aurora endpoint and the `snapshot mode = schema only recovery` .

And the main important thing is use a different topic for schema changes history. Else you'll end up with some error like below.
{% highlight shell %}
ERROR Failed due to error: Error processing binlog event (io.debezium.connector.mysql.BinlogReader)
org.apache.kafka.connect.errors.ConnectException: Encountered change event for table bhuvi.rohi whose schema isn't known to this connector
{% endhighlight %}

File: mysql-update.json
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
"database.user": "admin",
"database.server.id": "1",
"database.history.kafka.bootstrap.servers": "BROKER-NODE-IP:9092",
"database.server.name": "mysql-db01",
"database.port": "3306",
"key.converter.schemas.enable": "false",
"internal.key.converter": "org.apache.kafka.connect.json.JsonConverter",
"database.hostname": "SOURCE-AURORA-ENDPOINT",
"database.password": "*****",
"internal.value.converter.schemas.enable": "false",
"name": "mysql-connector-db01",
"value.converter.schemas.enable": "false",
"internal.value.converter": "org.apache.kafka.connect.json.JsonConverter",
"snapshot.mode": "SCHEMA_ONLY_RECOVERY"
}
{% endhighlight %}

Run the below command to update the  MySQL connector.
{% highlight shell %}
curl -X PUT -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:8083/connectors/mysql-connector-db01/config -d @mysql-update.json
{% endhighlight %}

Then immediately it'll start reading from the Source Aurora cluster from the binlog position `mysql-bin-changelog.000002 2170`

You can see these changes from the `connect-offsets` topic.
{% highlight shell %}
kafka-console-consumer --bootstrap-server localhost:9092 --topic connect-offsets --from-beginning

{"file":"mysql-bin-changelog.000006","pos":154}
{"file":"mysql-bin-changelog.000002","pos":2170}
{"ts_sec":1577948351,"file":"mysql-bin-changelog.000003","pos":1207,"row":1,"server_id":2115919109,"event":2}
{% endhighlight %}

And we add 2 more rows to the rohi table. You can see those new values from  the `bhuvi.rohi` topic.
{% highlight shell %}
kafka-console-consumer --bootstrap-server localhost:9092 --topic mysql-db01.bhuvi.rohi --from-beginning
{"id":1,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":2,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":3,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":4,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}
{"id":5,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":0}

{"id":6,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":1577948298000}
{"id":7,"fn":"rohit","ln":"last","phone":87611,"__ts_ms":1577948304000}
{% endhighlight %}

Also, you can the new table `testtbl` added to the topic.
{% highlight shell %}
kafka-topics --zookeeper localhost:2181 --list

connect-configs
connect-offsets
connect-status
default_ksql_processing_log
mysql-db01
mysql-db01.bhuvi.rohi
mysql-db01.bhuvi.testtbl
replica-schema-changes.mysql
schema-changes.mysql
{% endhighlight %}


### Debezium Series blogs:

1. [Build Production Grade Debezium Cluster With Confluent Kafka](https://thedataguy.in/build-production-grade-debezium-with-confluent-kafka-cluster/)
2. [Monitor Debezium MySQL Connector With Prometheus And Grafana](https://thedataguy.in/monitor-debezium-mysql-connector-with-prometheus-and-grafana/)
3. [Debezium MySQL Snapshot From Read Replica With GTID](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-with-gtid/)
4. [Debezium MySQL Snapshot From Read Replica And Resume From Master](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-and-resume-from-master/)
5. [Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot](https://thedataguy.in/debezium-mysql-snapshot-for-aws-rds-aurora-from-backup-snaphot/)
6. [RealTime CDC From MySQL Using AWS MSK With Debezium](https://medium.com/searce/realtime-cdc-from-mysql-using-aws-msk-with-debezium-28da5a4ca873)