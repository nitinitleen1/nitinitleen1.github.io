var store = [{
        "title": "Setting up an Airflow Cluster",
        "excerpt":"Data-driven companies often hinge their business intelligence and product development on the execution of complex data pipelines. These pipelines are often referred to as data workflows, a term that can be somewhat opaque in that workflows are not limited to one specific definition and do not perform a specific set of functions per se. To orchestrate these workflows there are lot of schedulers like oozie, Luigi, Azkaban and Airflow. This blog demonstrate the setup of one of these orchestrator i.e Airflow. A shot intro: There are many orchestrators which are there in the technology space but Airflow provides a slight edge if our requirement hinges on of the following:   No cron – With Airflows included scheduler we don’t need to rely on cron to schedule our DAG and only use one framework (not like Luigi)  Code Bases – In Airflow all the workflows, dependencies, and scheduling are done in python code. Therefore, it is rather easy to build complex structures and extend the flows.  Language – Python is a language somewhat natural to pick up and was available on our team.However setting up a production grade setup required some effort and this blog address the same. Basic Tech Terms:   Metastore: Its a database which stores information regarding the state of tasks. Database updates are performed using an abstraction layer implemented in SQLAlchemy. This abstraction layer cleanly separates the function of the remaining components of Airflow from the database.  Executor: The Executor is a message queuing process that is tightly bound to the Scheduler and determines the worker processes that actually execute each scheduled task.  Scheduler: The Scheduler is a process that uses DAG definitions in conjunction with the state of tasks in the metadata database to decide which tasks need to be executed, as well as their execution priority. The Scheduler is generally run as a service.  Worker: These are the processes that actually execute the logic of tasks, and are determined by the Executor being used.AWS Architecture:  Kafka and Zookeepers are installed on the same EC2. We we’ll deploy 3 node confluent Kafka cluster. Each node will be in a different availability zone.   172.31.47.152 - Zone A  172.31.38.158 - Zone B  172.31.46.207 - Zone CFor Producer(debezium) and Consumer(S3sink) will be hosted on the same Ec2. We’ll 3 nodes for this.   172.31.47.12 - Zone A  172.31.38.183 - Zone B  172.31.46.136 - Zone CInstance Type: Kafka nodes are generally needs Memory and Network Optimized. You can choose either Persistent and ephemeral storage. I prefer Persistent SSD Disks for Kafka storage. So add n GB size disk to your Kafka broker nodes. For Normal work loads its better to go with R5 instance Family. Mount the Volume in /kafkadata location. Security Group: Use a new Security group which allows the below ports.  Installation: Install the Java and Kafka on all the Broker nodes. -- Install OpenJDKapt-get -y update sudo apt-get -y install default-jre-- Install Confluent Kafka platformwget -qO - https://packages.confluent.io/deb/5.3/archive.key | sudo apt-key add -sudo add-apt-repository \"deb [arch=amd64] https://packages.confluent.io/deb/5.3 stable main\"sudo apt-get update &amp;&amp; sudo apt-get install confluent-platform-2.12Configuration: We need to configure Zookeeper and Kafaka properties, Edit the /etc/kafka/zookeeper.properties on all the kafka nodes -- On Node 1dataDir=/var/lib/zookeeperclientPort=2181maxClientCnxns=0server.1=0.0.0.0:2888:3888server.2=172.31.38.158:2888:3888server.3=172.31.46.207:2888:3888autopurge.snapRetainCount=3autopurge.purgeInterval=24initLimit=5syncLimit=2-- On Node 2dataDir=/var/lib/zookeeperclientPort=2181maxClientCnxns=0server.1=172.31.47.152:2888:3888server.2=0.0.0.0:2888:3888server.3=172.31.46.207:2888:3888autopurge.snapRetainCount=3autopurge.purgeInterval=24initLimit=5syncLimit=2-- On Node 3dataDir=/var/lib/zookeeperclientPort=2181maxClientCnxns=0server.1=172.31.47.152:2888:3888server.2=172.31.38.158:2888:3888server.3=0.0.0.0:2888:3888autopurge.snapRetainCount=3autopurge.purgeInterval=24initLimit=5syncLimit=2We need to assign a unique ID for all the Zookeeper nodes.  -- On Node 1 echo \"1\" &gt; /var/lib/zookeeper/myid  --On Node 2 echo \"2\" &gt; /var/lib/zookeeper/myid  --On Node 3 echo \"3\" &gt; /var/lib/zookeeper/myidNow we need to configure Kafka broker. So edit the /etc/kafka/server.properties on all the kafka nodes. --On Node 1broker.id.generation.enable=truedelete.topic.enable=truelisteners=PLAINTEXT://:9092zookeeper.connect=172.31.47.152:2181,172.31.38.158:2181,172.31.46.207:2181log.dirs=/kafkadata/kafkalog.retention.hours=168num.partitions=1--On Node 2broker.id.generation.enable=truedelete.topic.enable=truelisteners=PLAINTEXT://:9092log.dirs=/kafkadata/kafkazookeeper.connect=172.31.47.152:2181,172.31.38.158:2181,172.31.46.207:2181log.retention.hours=168num.partitions=1-- On Node 3broker.id.generation.enable=truedelete.topic.enable=truelisteners=PLAINTEXT://:9092log.dirs=/kafkadata/kafkazookeeper.connect=172.31.47.152:2181,172.31.38.158:2181,172.31.46.207:2181num.partitions=1log.retention.hours=168The next step is optimizing the Java JVM Heap size, In many places kafka will go down due to the less heap size. So Im allocating 50% of the Memory to Heap. But make sure more Heap size also bad. Please refer some documentation to set this value for very heavy systems. vi /usr/bin/kafka-server-startexport KAFKA_HEAP_OPTS=\"-Xmx2G -Xms2G\"The another major problem in the kafka system is the open file descriptors. So we need to allow the kafka to open at least up to 100000 files. vi /etc/pam.d/common-sessionsession required pam_limits.sovi /etc/security/limits.conf*                       soft    nofile          10000*                       hard    nofile          100000cp-kafka                soft    nofile          10000cp-kafka                hard    nofile          100000Here the cp-kafka is the default user for the kafka process. Create Kafka data dir: mkdir -p /kafkadata/kafkachown -R cp-kafka:confluent /kafkadata/kafkachmode 710 /kafkadata/kafkaStart the Kafka cluster: sudo systemctl start confluent-zookeepersudo systemctl start confluent-kafkasudo systemctl start confluent-schema-registryMake sure the Kafka has to automatically starts after the Ec2 restart. sudo systemctl enable confluent-zookeepersudo systemctl enable confluent-kafkasudo systemctl enable confluent-schema-registryNow our kafka cluster is ready. To check the list of system topics run the following command. kafka-topics --list --zookeeper localhost:2181__confluent.support.metricsSetup Debezium: Install the confluent connector and debezium MySQL connector on all the producer nodes. apt-get update sudo apt-get install default-jre wget -qO - https://packages.confluent.io/deb/5.3/archive.key | sudo apt-key add -sudo add-apt-repository \"deb [arch=amd64] https://packages.confluent.io/deb/5.3 stable main\"sudo apt-get update &amp;&amp; sudo apt-get install confluent-hub-client confluent-common confluent-kafka-connect-s3 confluent-kafka-2.12Configuration: Edit the /etc/kafka/connect-distributed.properties on all the producer nodes to make our producer will run on a distributed manner. -- On all the connector nodesbootstrap.servers=172.31.47.152:9092,172.31.38.158:9092,172.31.46.207:9092group.id=debezium-clusterplugin.path=/usr/share/java,/usr/share/confluent-hub-componentsInstall Debezium MySQL Connector: confluent-hub install debezium/debezium-connector-mysql:latestit’ll ask for making some changes just select Y for everything. Run the distributed connector as a service: vi /lib/systemd/system/confluent-connect-distributed.service[Unit]Description=Apache Kafka - connect-distributedDocumentation=http://docs.confluent.io/After=network.target[Service]Type=simpleUser=cp-kafkaGroup=confluentExecStart=/usr/bin/connect-distributed /etc/kafka/connect-distributed.propertiesTimeoutStopSec=180Restart=no[Install]WantedBy=multi-user.targetStart the Service: systemctl enable confluent-connect-distributedsystemctl start confluent-connect-distributedConfigure Debezium MySQL Connector: Create a mysql.json file which contains the MySQL information and other formatting options. {\t\"name\": \"mysql-connector-db01\",\t\"config\": {\t\t\"name\": \"mysql-connector-db01\",\t\t\"connector.class\": \"io.debezium.connector.mysql.MySqlConnector\",\t\t\"database.server.id\": \"1\",\t\t\"tasks.max\": \"3\",\t\t\"database.history.kafka.bootstrap.servers\": \"172.31.47.152:9092,172.31.38.158:9092,172.31.46.207:9092\",\t\t\"database.history.kafka.topic\": \"schema-changes.mysql\",\t\t\"database.server.name\": \"mysql-db01\",\t\t\"database.hostname\": \"172.31.84.129\",\t\t\"database.port\": \"3306\",\t\t\"database.user\": \"bhuvi\",\t\t\"database.password\": \"my_stong_password\",\t\t\"database.whitelist\": \"proddb,test\",\t\t\"internal.key.converter.schemas.enable\": \"false\",\t\t\"key.converter.schemas.enable\": \"false\",\t\t\"internal.key.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"internal.value.converter.schemas.enable\": \"false\",\t\t\"value.converter.schemas.enable\": \"false\",\t\t\"internal.value.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"value.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"key.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"transforms\": \"unwrap\",\t\t\"transforms.unwrap.type\": \"io.debezium.transforms.ExtractNewRecordState\",        \"transforms.unwrap.add.source.fields\": \"ts_ms\",\t\t\"tombstones.on.delete\": false\t}}  “database.history.kafka.bootstrap.servers” - Kafka Servers IP.  “database.whitelist” - List of databases to get the CDC.  key.converter and value.converter and transforms parameters - By default Debezium output will have more detailed information. But I don’t want all of those information. Im only interested in to get the new row and the timestamp when its inserted.If you don’t want to customize anythings then just remove everything after the database.whitelist Register the MySQL Connector: curl -X POST -H \"Accept: application/json\" -H \"Content-Type: application/json\" http://localhost:8083/connectors -d @mysql.jsonCheck the status: curl GET localhost:8083/connectors/mysql-connector-db01/status{  \"name\": \"mysql-connector-db01\",  \"connector\": {    \"state\": \"RUNNING\",    \"worker_id\": \"172.31.94.191:8083\"  },  \"tasks\": [    {      \"id\": 0,      \"state\": \"RUNNING\",      \"worker_id\": \"172.31.94.191:8083\"    }  ],  \"type\": \"source\"}Test the MySQL Consumer: Now insert something into any tables in proddb or test (because we have whilelisted only these databaes to capture the CDC. use test;create table rohi (id int,fn varchar(10),ln varchar(10),phone int );insert into rohi values (2, 'rohit', 'ayare','87611');We can get these values from the Kafker brokers. Open any one the kafka node and run the below command. I prefer confluent cli for this. By default it’ll not be available, so download manually. curl -L https://cnfl.io/cli | sh -s -- -b /usr/bin/Listen the below topic:   mysql-db01.test.rohi This is the combination of servername.databasename.tablename servername(you mentioned this in as a server name in mysql json file). confluent local consume mysql-db01.test.rohi----The local commands are intended for a single-node development environmentonly, NOT for production usage. https://docs.confluent.io/current/cli/index.html-----{\"id\":1,\"fn\":\"rohit\",\"ln\":\"ayare\",\"phone\":87611,\"__ts_ms\":1576757407000}Setup S3 Sink connector in All Producer Nodes: I want to send this data to S3 bucket. So you must have an EC2 IAM role which has access to the target S3 bucket. Or install awscli and configure access and secret key(but its not recommended) Install S3 Connector: confluent-hub install confluentinc/kafka-connect-s3:latestCreate s3.json file. {\t\"name\": \"s3-sink-db01\",\t\"config\": {\t\t\"connector.class\": \"io.confluent.connect.s3.S3SinkConnector\",\t\t\"storage.class\": \"io.confluent.connect.s3.storage.S3Storage\",\t\t\"s3.bucket.name\": \"bhuvi-datalake\",\t\t\"name\": \"s3-sink-db01\",\t\t\"tasks.max\": \"3\",\t\t\"s3.region\": \"us-east-1\",\t\t\"s3.part.size\": \"5242880\",\t\t\"s3.compression.type\": \"gzip\",\t\t\"timezone\": \"UTC\",\t\t\"locale\": \"en\",\t\t\"flush.size\": \"10000\",\t\t\"rotate.interval.ms\": \"3600000\",\t\t\"topics.regex\": \"mysql-db01.(.*)\",\t\t\"internal.key.converter.schemas.enable\": \"false\",\t\t\"key.converter.schemas.enable\": \"false\",\t\t\"internal.key.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"format.class\": \"io.confluent.connect.s3.format.json.JsonFormat\",\t\t\"internal.value.converter.schemas.enable\": \"false\",\t\t\"value.converter.schemas.enable\": \"false\",\t\t\"internal.value.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"value.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"key.converter\": \"org.apache.kafka.connect.json.JsonConverter\",\t\t\"partitioner.class\": \"io.confluent.connect.storage.partitioner.HourlyPartitioner\",\t\t\"path.format\": \"YYYY/MM/dd/HH\",\t\t\"partition.duration.ms\": \"3600000\",\t\t\"rotate.schedule.interval.ms\": \"3600000\"\t}}  \"topics.regex\": \"mysql-db01\" - It’ll send the data only from the topics which has mysql-db01 as prefix. In our case all the MySQL databases related topics will start  with this prefix.  \"flush.size\" - The data will uploaded to S3 only after these many number of records stored. Or after \"rotate.schedule.interval.ms\" this duration.Register this S3 sink connector: curl -X POST -H \"Accept: application/json\" -H \"Content-Type: application/json\" http://localhost:8083/connectors -d @s3Check the Status: curl GET localhost:8083/connectors/s3-sink-db01/status{  \"name\": \"s3-sink-db01\",  \"connector\": {    \"state\": \"RUNNING\",    \"worker_id\": \"172.31.94.191:8083\"  },  \"tasks\": [    {      \"id\": 0,      \"state\": \"RUNNING\",      \"worker_id\": \"172.31.94.191:8083\"    },    {      \"id\": 1,      \"state\": \"RUNNING\",      \"worker_id\": \"172.31.94.191:8083\"    },    {      \"id\": 2,      \"state\": \"RUNNING\",      \"worker_id\": \"172.31.94.191:8083\"    }  ],  \"type\": \"sink\"}Test the S3 sync: Insert the 10000 rows into the rohi table. Then check the S3 bucket. It’ll save the data in JSON format with GZIP compression. Also in a HOUR wise partitions.   Monitoring: Refer this post to setup monitoring for MySQL Connector. More Tuning:   Replication Factor is the other main parameter to the data durability.  Use internal IP addresses as much as you can.  By default debezium uses 1 Partition per topic. You can configure this based on your work load. But more partitions more through put needed.References:   Setup Kafka in production by confluent  How to choose number of partition  Open file descriptors for Kafka   Kafka best practices in AWS  Debezium documentation  Customize debezium output with SMTDebezium Series blogs:   Build Production Grade Debezium Cluster With Confluent Kafka  Monitor Debezium MySQL Connector With Prometheus And Grafana  Debezium MySQL Snapshot From Read Replica With GTID  Debezium MySQL Snapshot From Read Replica And Resume From Master  Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot  RealTime CDC From MySQL Using AWS MSK With Debezium","categories": ["Airflow"],
        "tags": ["airflow","postgresql","data-pipeline","aws","rabbitmq"],
        "url": "http://localhost:4000/build-production-grade-debezium-with-confluent-kafka-cluster/"
      }]
