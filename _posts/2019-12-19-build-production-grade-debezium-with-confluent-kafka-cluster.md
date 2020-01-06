---
title: Build Production Grade Debezium Cluster With Confluent Kafka
date: 2019-12-19 21:13:00 +0530
description: Configure the Production grade debezium cluster with confluent kafka
  in aws. Sync data between MySQL and S3 with Debezium MySQL connector.
categories:
- Kafka
tags:
- aws
- kafka
- confluent
- debezium
- cdc
- mysql
- s3
image: "/assets/Build Production Grade Dedezium Cluster With Confluent Kafka.jpg"

---
We are living in the DataLake world. Now almost every organizations wants their reporting in Near Real Time. Kafka is of the best streaming platform for realtime reporting. Based on the Kafka connector, RedHat designed the Debezium which is an OpenSource product and high recommended for real time CDC from transnational databases. I referred many blogs to setup this cluster. But I found just basic installation steps. So I setup this cluster for AWS with Production grade and publishing this blog.

## A shot intro:

Debezium is a set of distributed services to capture changes in your databases so that your applications can see those changes and respond to them. Debezium records all row-level changes within each database table in a _change event stream_, and applications simply read these streams to see the change events in the same order in which they occurred.

## Basic Tech Terms:

* **Kafka Broker:** Brokers are the core for the kafka streaming, they'll keep your messages and giving it to the consumers. 
* **Zookeeper**: It'll maintain the cluster status and node status. It'll help to make the Kafka's availability. 
* **Producers:** The component who will send the messages(data) to the Broker.
* **Consumers:** The component who will get the messages from the Queue for further analytics.
* **Confluent:** Confluent is having their own steaming platform which basically using Apache Kafka under the hood. But it has more features.

Here **Debezium** is our data producer and **S3sink** is our consumer. For this setup, Im going to stream the MySQL data changes to S3 with customized format. 

## AWS Architecture: 

![](/assets/Build Production Grade Dedezium Cluster With Confluent Kafka-3.jpg)

Kafka and Zookeepers are installed on the same EC2. We we'll deploy 3 node confluent Kafka cluster. Each node will be in a different availability zone.

* 172.31.47.152 - Zone A
* 172.31.38.158 - Zone B
* 172.31.46.207 - Zone C 

For Producer(debezium) and Consumer(S3sink) will be hosted on the same Ec2. We'll 3 nodes for this.

* 172.31.47.12 - Zone A
* 172.31.38.183 - Zone B
* 172.31.46.136 - Zone C

## Instance Type:

Kafka nodes are generally needs Memory and Network Optimized. You can choose either Persistent and ephemeral storage. I prefer Persistent SSD Disks for Kafka storage. So add n GB size disk to your Kafka broker nodes. For Normal work loads its better to go with R5 instance Family.

Mount the Volume in `/kafkadata` location.

## Security Group:

Use a new Security group which allows the below ports.

![](/assets/Build Production Grade Dedezium Cluster With Confluent Kafka-4.jpg)

## Installation:

Install the Java and Kafka on all the Broker nodes.
 {% highlight shell %}
-- Install OpenJDK
apt-get -y update 
sudo apt-get -y install default-jre

-- Install Confluent Kafka platform
wget -qO - https://packages.confluent.io/deb/5.3/archive.key | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://packages.confluent.io/deb/5.3 stable main"
sudo apt-get update && sudo apt-get install confluent-platform-2.12
{% endhighlight %}

## Configuration:

We need to configure Zookeeper and Kafaka properties, Edit the `/etc/kafka/zookeeper.properties` on all the kafka nodes
 {% highlight shell %}
-- On Node 1
dataDir=/var/lib/zookeeper
clientPort=2181
maxClientCnxns=0
server.1=0.0.0.0:2888:3888
server.2=172.31.38.158:2888:3888
server.3=172.31.46.207:2888:3888
autopurge.snapRetainCount=3
autopurge.purgeInterval=24
initLimit=5
syncLimit=2

-- On Node 2
dataDir=/var/lib/zookeeper
clientPort=2181
maxClientCnxns=0
server.1=172.31.47.152:2888:3888
server.2=0.0.0.0:2888:3888
server.3=172.31.46.207:2888:3888
autopurge.snapRetainCount=3
autopurge.purgeInterval=24
initLimit=5
syncLimit=2

-- On Node 3
dataDir=/var/lib/zookeeper
clientPort=2181
maxClientCnxns=0
server.1=172.31.47.152:2888:3888
server.2=172.31.38.158:2888:3888
server.3=0.0.0.0:2888:3888
autopurge.snapRetainCount=3
autopurge.purgeInterval=24
initLimit=5
syncLimit=2
{% endhighlight %}

We need to assign a unique ID for all the Zookeeper nodes. 
 {% highlight shell %}
 -- On Node 1
 echo "1" > /var/lib/zookeeper/myid
 
 --On Node 2
 echo "2" > /var/lib/zookeeper/myid
 
 --On Node 3
 echo "3" > /var/lib/zookeeper/myid
{% endhighlight %}

Now we need to configure Kafka broker. So edit the `/etc/kafka/server.properties` on all the kafka nodes.
 {% highlight shell %}
--On Node 1
broker.id.generation.enable=true
delete.topic.enable=true
listeners=PLAINTEXT://:9092
zookeeper.connect=172.31.47.152:2181,172.31.38.158:2181,172.31.46.207:2181
log.dirs=/kafkadata/kafka
log.retention.hours=168
num.partitions=1

--On Node 2
broker.id.generation.enable=true
delete.topic.enable=true
listeners=PLAINTEXT://:9092
log.dirs=/kafkadata/kafka
zookeeper.connect=172.31.47.152:2181,172.31.38.158:2181,172.31.46.207:2181
log.retention.hours=168
num.partitions=1

-- On Node 3
broker.id.generation.enable=true
delete.topic.enable=true
listeners=PLAINTEXT://:9092
log.dirs=/kafkadata/kafka
zookeeper.connect=172.31.47.152:2181,172.31.38.158:2181,172.31.46.207:2181
num.partitions=1
log.retention.hours=168
{% endhighlight %}

The next step is optimizing the `Java JVM Heap` size, In many places kafka will go down due to the less heap size. So Im allocating 50% of the Memory to Heap. But make sure more Heap size also bad. Please refer some documentation to set this value for very heavy systems.

 {% highlight shell %}
vi /usr/bin/kafka-server-start
export KAFKA_HEAP_OPTS="-Xmx2G -Xms2G"
{% endhighlight %}

The another major problem in the kafka system is the open file descriptors. So we need to allow the kafka to open at least up to 100000 files.
 {% highlight shell %}
vi /etc/pam.d/common-session
session required pam_limits.so

vi /etc/security/limits.conf

*                       soft    nofile          10000
*                       hard    nofile          100000
cp-kafka                soft    nofile          10000
cp-kafka                hard    nofile          100000
{% endhighlight %}

Here the `cp-kafka` is the default user for the kafka process.

### Create Kafka data dir:
 {% highlight shell %}
mkdir -p /kafkadata/kafka
chown -R cp-kafka:confluent /kafkadata/kafka
chmode 710 /kafkadata/kafka
{% endhighlight %}

### Start the Kafka cluster:
 {% highlight shell %}
sudo systemctl start confluent-zookeeper
sudo systemctl start confluent-kafka
sudo systemctl start confluent-schema-registry
{% endhighlight %}

Make sure the Kafka has to automatically starts after the Ec2 restart.
 {% highlight shell %}
sudo systemctl enable confluent-zookeeper
sudo systemctl enable confluent-kafka
sudo systemctl enable confluent-schema-registry
{% endhighlight %}

Now our kafka cluster is ready. To check the list of system topics run the following command.
 {% highlight shell %}
kafka-topics --list --zookeeper localhost:2181

__confluent.support.metrics
{% endhighlight %}

## Setup Debezium:

Install the confluent connector and debezium MySQL connector on all the producer nodes.
 {% highlight shell %}
apt-get update 
sudo apt-get install default-jre
 
wget -qO - https://packages.confluent.io/deb/5.3/archive.key | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://packages.confluent.io/deb/5.3 stable main"
sudo apt-get update && sudo apt-get install confluent-hub-client confluent-common confluent-kafka-connect-s3 confluent-kafka-2.12
{% endhighlight %}

### Configuration:

Edit the `/etc/kafka/connect-distributed.properties` on all the producer nodes to make our producer will run on a distributed manner.
 {% highlight shell %}
-- On all the connector nodes
bootstrap.servers=172.31.47.152:9092,172.31.38.158:9092,172.31.46.207:9092
group.id=debezium-cluster
plugin.path=/usr/share/java,/usr/share/confluent-hub-components
{% endhighlight %}

### Install Debezium MySQL Connector:

 {% highlight shell %}
confluent-hub install debezium/debezium-connector-mysql:latest
{% endhighlight %}

it'll ask for making some changes just select `Y` for everything.

### Run the distributed connector as a service:
 {% highlight shell %}
vi /lib/systemd/system/confluent-connect-distributed.service

[Unit]
Description=Apache Kafka - connect-distributed
Documentation=http://docs.confluent.io/
After=network.target

[Service]
Type=simple
User=cp-kafka
Group=confluent
ExecStart=/usr/bin/connect-distributed /etc/kafka/connect-distributed.properties
TimeoutStopSec=180
Restart=no

[Install]
WantedBy=multi-user.target
{% endhighlight %}

### Start the Service:
 {% highlight shell %}
systemctl enable confluent-connect-distributed
systemctl start confluent-connect-distributed
{% endhighlight %}

## Configure Debezium MySQL Connector:

Create a `mysql.json` file which contains the MySQL information and other formatting options.
 {% highlight json %}
{
	"name": "mysql-connector-db01",
	"config": {
		"name": "mysql-connector-db01",
		"connector.class": "io.debezium.connector.mysql.MySqlConnector",
		"database.server.id": "1",
		"tasks.max": "3",
		"database.history.kafka.bootstrap.servers": "172.31.47.152:9092,172.31.38.158:9092,172.31.46.207:9092",
		"database.history.kafka.topic": "schema-changes.mysql",
		"database.server.name": "mysql-db01",
		"database.hostname": "172.31.84.129",
		"database.port": "3306",
		"database.user": "bhuvi",
		"database.password": "my_stong_password",
		"database.whitelist": "proddb,test",
		"internal.key.converter.schemas.enable": "false",
		"key.converter.schemas.enable": "false",
		"internal.key.converter": "org.apache.kafka.connect.json.JsonConverter",
		"internal.value.converter.schemas.enable": "false",
		"value.converter.schemas.enable": "false",
		"internal.value.converter": "org.apache.kafka.connect.json.JsonConverter",
		"value.converter": "org.apache.kafka.connect.json.JsonConverter",
		"key.converter": "org.apache.kafka.connect.json.JsonConverter",
		"transforms": "unwrap",
		"transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
        "transforms.unwrap.add.source.fields": "ts_ms",
		"tombstones.on.delete": false
	}
}
{% endhighlight %}

* "database.history.kafka.bootstrap.servers" - Kafka Servers IP.
* "database.whitelist" - List of databases to get the CDC.
* key.converter and value.converter and transforms parameters - By default Debezium output will have more detailed information. But I don't want all of those information. Im only interested in to get the new row and the timestamp when its inserted.

If you don't want to customize anythings then just remove everything after the `database.whitelist`

### Register the MySQL Connector:
 {% highlight shell %}
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:8083/connectors -d @mysql.json
{% endhighlight %}

### Check the status:
 {% highlight shell %}
curl GET localhost:8083/connectors/mysql-connector-db01/status
{
  "name": "mysql-connector-db01",
  "connector": {
    "state": "RUNNING",
    "worker_id": "172.31.94.191:8083"
  },
  "tasks": [
    {
      "id": 0,
      "state": "RUNNING",
      "worker_id": "172.31.94.191:8083"
    }
  ],
  "type": "source"
}
{% endhighlight %}

### Test the MySQL Consumer: 

Now insert something into any tables in `proddb or test` (because we have whilelisted only these databaes to capture the CDC. 
 {% highlight sql %}
use test;
create table rohi (id int,
fn varchar(10),
ln varchar(10),
phone int );

insert into rohi values (2, 'rohit', 'ayare','87611');
{% endhighlight %}

We can get these values from the Kafker brokers. Open any one the kafka node and run the below command.

I prefer confluent cli for this. By default it'll not be available, so download manually.
 {% highlight shell %}
curl -L https://cnfl.io/cli | sh -s -- -b /usr/bin/
{% endhighlight %}

### Listen the below topic:

> **mysql-db01.test.rohi**   
> This is the combination of `servername.databasename.tablename`   
> servername(you mentioned this in as a server name in mysql json file).
 {% highlight shell %}
confluent local consume mysql-db01.test.rohi

----
The local commands are intended for a single-node development environment
only, NOT for production usage. https://docs.confluent.io/current/cli/index.html
-----

{"id":1,"fn":"rohit","ln":"ayare","phone":87611,"__ts_ms":1576757407000}
{% endhighlight %}

## Setup S3 Sink connector in All Producer Nodes:

I want to send this data to S3 bucket. So you must have an EC2 IAM role which has access to the target S3 bucket. Or install `awscli` and configure access and secret key(but its not recommended)

### Install S3 Connector:
{% highlight shell %}
confluent-hub install confluentinc/kafka-connect-s3:latest
{% endhighlight %}


Create `s3.json` file.
 {% highlight json %}
{
	"name": "s3-sink-db01",
	"config": {
		"connector.class": "io.confluent.connect.s3.S3SinkConnector",
		"storage.class": "io.confluent.connect.s3.storage.S3Storage",
		"s3.bucket.name": "bhuvi-datalake",
		"name": "s3-sink-db01",
		"tasks.max": "3",
		"s3.region": "us-east-1",
		"s3.part.size": "5242880",
		"s3.compression.type": "gzip",
		"timezone": "UTC",
		"locale": "en",
		"flush.size": "10000",
		"rotate.interval.ms": "3600000",
		"topics.regex": "mysql-db01.(.*)",
		"internal.key.converter.schemas.enable": "false",
		"key.converter.schemas.enable": "false",
		"internal.key.converter": "org.apache.kafka.connect.json.JsonConverter",
		"format.class": "io.confluent.connect.s3.format.json.JsonFormat",
		"internal.value.converter.schemas.enable": "false",
		"value.converter.schemas.enable": "false",
		"internal.value.converter": "org.apache.kafka.connect.json.JsonConverter",
		"value.converter": "org.apache.kafka.connect.json.JsonConverter",
		"key.converter": "org.apache.kafka.connect.json.JsonConverter",
		"partitioner.class": "io.confluent.connect.storage.partitioner.HourlyPartitioner",
		"path.format": "YYYY/MM/dd/HH",
		"partition.duration.ms": "3600000",
		"rotate.schedule.interval.ms": "3600000"
	}
}
{% endhighlight %}

* `"topics.regex": "mysql-db01"` - It'll send the data only from the topics which has `mysql-db01` as prefix. In our case all the MySQL databases related topics will start  with this prefix.
* `"flush.size"` - The data will uploaded to S3 only after these many number of records stored. Or after `"rotate.schedule.interval.ms"` this duration.

### Register this S3 sink connector:
{% highlight shell %}
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:8083/connectors -d @s3
{% endhighlight %}

### Check the Status: 
 {% highlight shell %}
curl GET localhost:8083/connectors/s3-sink-db01/status
{
  "name": "s3-sink-db01",
  "connector": {
    "state": "RUNNING",
    "worker_id": "172.31.94.191:8083"
  },
  "tasks": [
    {
      "id": 0,
      "state": "RUNNING",
      "worker_id": "172.31.94.191:8083"
    },
    {
      "id": 1,
      "state": "RUNNING",
      "worker_id": "172.31.94.191:8083"
    },
    {
      "id": 2,
      "state": "RUNNING",
      "worker_id": "172.31.94.191:8083"
    }
  ],
  "type": "sink"
}
{% endhighlight %}
### Test the S3 sync:

Insert the 10000 rows into the `rohi` table. Then check the S3 bucket. It'll save the data in JSON format with GZIP compression. Also in a HOUR wise partitions. 

![](/assets/Build Production Grade Dedezium Cluster With Confluent Kafka-1.jpg)

![](/assets/Build Production Grade Dedezium Cluster With Confluent Kafka-2.jpg)

## Monitoring:
Refer [this post](https://thedataguy.in/monitor-debezium-mysql-connector-with-prometheus-and-grafana/) to setup monitoring for MySQL Connector.

## More Tuning: 

* Replication Factor is the other main parameter to the data durability. 
* Use internal IP addresses as much as you can. 
* By default debezium uses 1 Partition per topic. You can configure this based on your work load. But more partitions more through put needed. 

## References: 

1. [Setup Kafka in production by confluent](https://docs.confluent.io/current/kafka/deployment.html)
2. [How to choose number of partition](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/)
3. [Open file descriptors for Kafka ](https://log-it.ro/2017/10/16/ubuntu-change-ulimit-kafka-not-ignore/)
4. [Kafka best practices in AWS](https://aws.amazon.com/blogs/big-data/best-practices-for-running-apache-kafka-on-aws/)
5. [Debezium documentation](https://debezium.io/documentation/reference/1.0/tutorial.html)
6. [Customize debezium output with SMT](https://debezium.io/documentation/reference/1.0/configuration/event-flattening.html)

### Debezium Series blogs:

1. [Build Production Grade Debezium Cluster With Confluent Kafka](https://thedataguy.in/build-production-grade-debezium-with-confluent-kafka-cluster/)
2. [Monitor Debezium MySQL Connector With Prometheus And Grafana](https://thedataguy.in/monitor-debezium-mysql-connector-with-prometheus-and-grafana/)
3. [Debezium MySQL Snapshot From Read Replica With GTID](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-with-gtid/)
4. [Debezium MySQL Snapshot From Read Replica And Resume From Master](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-and-resume-from-master/)
5. [Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot](https://thedataguy.in/debezium-mysql-snapshot-for-aws-rds-aurora-from-backup-snaphot/)
6. [RealTime CDC From MySQL Using AWS MSK With Debezium](https://medium.com/searce/realtime-cdc-from-mysql-using-aws-msk-with-debezium-28da5a4ca873)