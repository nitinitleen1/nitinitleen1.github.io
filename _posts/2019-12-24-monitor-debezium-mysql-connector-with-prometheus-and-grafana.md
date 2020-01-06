---
title: Monitor Debezium MySQL Connector With Prometheus And Grafana
date: 2019-12-24 06:20:00 +0000
description: Setup JMX exporter monitoring for debezium MySQL connector with Prometheus
  and grafana. Download the common JSON dashboard template.
categories:
- Kafka
tags:
- Kafka
- grafana
- prometheus
- debezium
- mysql
- jmx
- monitoring
image: "/assets/Monitor Debezium MySQL Connector With Prometheus And Grafana.jpg"

---
Debezium is providing out of the box CDC solution from various databases. In my last blog post, I have published how to configure the Debezium MySQL connector. This is the next part of that post. Once we deployed the debezium, to we need some kind of monitoring to keep track of whats happening in the debezium connector. Luckily Debezium has its own metrics that are already integrated with the connectors. We just need to capture them using the JMX exporter agent. Here I have written how to monitor Debezium MySQL connector with Prometheus and Grafana. But the dashboard is having the basic metrics only. You can build your own dashboard for more detailed monitoring.

**Reference**: [List of Debezium monitoring metrics](https://debezium.io/documentation/reference/1.0/assemblies/cdc-mysql-connector/as_deploy-the-mysql-connector.html#mysql-connector-monitoring-metrics_debezium)

## Install JMX exporter in Kafka Distributed connector:

All the connectors are managed by the Kafka connect(Distributed or standalone). In our previous blog, we used Distributed Kafka connect service. So we are going to modify the distributed service binary file.  
Download the JMX exporter.

    {% highlight shell %}
    mkdir/opt/jmx/
    cd /opt/jmx/
    wget https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.12.0/jmx_prometheus_javaagent-0.12.0.jar
    mv jmx_prometheus_javaagent-0.12.0.jar jmx-exporter.jar
    {% endhighlight %}

Create config file.

{% highlight shell %}
vi /opt/jmx/config.yml
    
startDelaySeconds: 0
ssl: false
lowercaseOutputName: false
lowercaseOutputLabelNames: false
rules:
- pattern : "kafka.connect<type=connect-worker-metrics>([^:]+):"
  name: "kafka_connect_connect_worker_metrics_$1"
- pattern : "kafka.connect<type=connect-metrics, client-id=([^:]+)><>([^:]+)"
  name: "kafka_connect_connect_metrics_$2"
  labels:
    client: "$1"
- pattern: "debezium.([^:]+)<type=connector-metrics, context=([^,]+), server=([^,]+), key=([^>]+)><>RowsScanned"
  name: "debezium_metrics_RowsScanned"
  labels:
    plugin: "$1"
    name: "$3"
    context: "$2"
    table: "$4"
- pattern: "debezium.([^:]+)<type=connector-metrics, context=([^,]+), server=([^>]+)>([^:]+)"
  name: "debezium_metrics_$4"
  labels:
    plugin: "$1"
    name: "$3"
    context: "$2"
{% endhighlight %}

Add the JMX export to the Kafka connect binary File.

    {% highlight shell %}
    vi /usr/bin/connect-distributed
    
    -- Find this line below export CLASSPATH
    exec $(dirname $0)/kafka-run-class $EXTRA_ARGS org.apache.kafka.connect.cli.ConnectDistributed "$@"
    
    --Replace with
    exec $(dirname $0)/kafka-run-class $EXTRA_ARGS -javaagent:/opt/jmx/jmx-exporter.jar=7071:/opt/jmx/config.yml org.apache.kafka.connect.cli.ConnectDistributed "$@"
    {% endhighlight %}

Restart the Distributed Connect Service.

    {% highlight shell %}
    systemctl restart confluent-connect-distributed
    {% endhighlight %}

Verify the JMX Agent installation.

    {% highlight shell %}
    netstat -tulpn | grep 7071
    tcp6       0      0 :::7071                 :::*                    LISTEN      2885/java
    {% endhighlight %}

Get the debezium metrics.

    {% highlight shell %}
    curl localhost:7071 | grep debezium
    :-debezium_metrics_NumberOfDisconnects{context="binlog",name="mysql-db01",plugin="mysql",} 0.
    {% endhighlight %}

You can these metrics in your browser as well.

    {% highlight shell %}
    http://ip-of-the-connector-vm:7071/metrics
    {% endhighlight %}

## Install Prometheus

Im using a separate server for Prometheus and Grafana.

Create a user for Prometheus:

    {% highlight shell %}
    sudo useradd --no-create-home --shell /bin/false prometheus
    {% endhighlight %}

Create Directories for Prometheus:

    {% highlight shell %}
    sudo mkdir /etc/prometheus
    sudo mkdir /var/lib/prometheus
    sudo chown prometheus:prometheus /etc/prometheus
    sudo chown prometheus:prometheus /var/lib/prometheus
    {% endhighlight %}

Download the Prometheus binary files:

    {% highlight shell %}
    cd /tmp
    wget https://github.com/prometheus/prometheus/releases/download/v2.15.0/prometheus-2.15.0.linux-amd64.tar.gz
    tar -zxvf prometheus-2.15.0.linux-amd64.tar.gz
    {% endhighlight %}

Copy the binary files to respective locations:

    {% highlight shell %}
    cd prometheus-2.15.0.linux-amd64
    cp prometheus /usr/local/bin/
    cp promtool /usr/local/bin/
    sudo chown prometheus:prometheus /usr/local/bin/prometheus
    sudo chown prometheus:prometheus /usr/local/bin/promtool
    cp -r consoles /etc/prometheus
    cp -r console_libraries /etc/prometheus
    sudo chown -R prometheus:prometheus /etc/prometheus/consoles
    sudo chown -R prometheus:prometheus /etc/prometheus/console_libraries
    {% endhighlight %}

Create a Prometheus config file:

{% highlight yml %}
vi  /etc/prometheus/prometheus.yml
    
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']

{% endhighlight %}

Set permission for config file:

    {% highlight shell %}
    sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml
    {% endhighlight %}

Create a Prometheus systemctl file:

    {% highlight shell %}
    vi /etc/systemd/system/prometheus.service
    
    [Unit]
    Description=Prometheus
    Wants=network-online.target
    After=network-online.target
    
    [Service]
    User=prometheus
    Group=prometheus
    Type=simple
    ExecStart=/usr/local/bin/prometheus \
        --config.file /etc/prometheus/prometheus.yml \
        --storage.tsdb.path /var/lib/prometheus/ \
        --web.console.templates=/etc/prometheus/consoles \
        --web.console.libraries=/etc/prometheus/console_libraries
    
    [Install]
    WantedBy=multi-user.target
    {% endhighlight %}

Start the Prometheus Service:

    {% highlight shell %}
    sudo systemctl daemon-reload
    sudo systemctl start prometheus
    sudo systemctl enable prometheus
    {% endhighlight %}

Add Debezium MySQL connector metrics to Prometheus:

{% highlight shell %}
vi  /etc/prometheus/prometheus.yml


  - job_name: debezium
    scrape_interval: 5s
    static_configs:
      - targets:
          - debezium-node-ip:7071
{% endhighlight %} 

Restart the Prometheus service:

    {% highlight shell %}
    sudo systemctl restart prometheus
    {% endhighlight %}

Check the status:

In your browser Open the below URL.

    {% highlight shell %}
    http://IP_of-prometheus-ec2:9090/graph
    {% endhighlight %}

![](/assets/Monitor Debezium MySQL Connector With Prometheus And Grafana-2.jpg)

## Install Grafana:

    {% highlight shell %}
    wget https://dl.grafana.com/oss/release/grafana_6.5.2_amd64.deb
    sudo dpkg -i grafana_6.5.2_amd64.deb
    sudo systemctl daemon-reload
    sudo systemctl start grafana-server
    {% endhighlight %}

It'll start listening to the port 3000. The default username and password `admin/admin`. You can change once you logged in.

    {% highlight shell %}
    http://grafana-server-ip:3000
    {% endhighlight %}

Add the Debezium MySQL Dashboard:

This dashboard is taken from the official Debezium's example repo. But they gave this for MSSQL Server. With some changes and fixes, we can use the same for MySQL and other databases. I made it as a template.  
In grafana add the Prometheus datasource.

    {% highlight shell %}
    http://grafana-ip:3000/datasources
    {% endhighlight %}

Click on Add Data source, select Prometheus.

* **Name**: Prometheus
* **URL**: localhost:9090 (I have installed grafana and Prometheus on the same server, If you have different server for Prometheus, use that IP instead of localhost).

Click on Save & Test.

You'll get a pop-up message that its is connected.

Now go to the dashboards page and import the Template JSON.

    {% highlight shell %}
    http://grafan-ip:3000/dashboards
    {% endhighlight %}

Click on Import button.

Copy the Template JSON file from [**here**](https://github.com/BhuviTheDataGuy/Debezium-monitor/blob/master/grafana-templates/debezium-monitor-template.json). Paste it or download the JSON file and choose the upload button. Now the dashboard is ready. You can see a few basic metrics.

![](/assets/Monitor Debezium MySQL Connector With Prometheus And Grafana-1.jpg)

## Contribution:

Debezium is a great platform for who wants to do real-time analytics. But in terms of monitoring, still, I feel it should get more contribution. This template is just a kickstart. We can build a more detailed monitoring dashboard for the debezium connectors. Please feel free to contribute to [**repo**](https://github.com/BhuviTheDataGuy/Debezium-monitor/). Pull requests are welcome. Lets make the debezium more powerful.

### Debezium Series blogs:

1. [Build Production Grade Debezium Cluster With Confluent Kafka](https://thedataguy.in/build-production-grade-debezium-with-confluent-kafka-cluster/)
2. [Monitor Debezium MySQL Connector With Prometheus And Grafana](https://thedataguy.in/monitor-debezium-mysql-connector-with-prometheus-and-grafana/)
3. [Debezium MySQL Snapshot From Read Replica With GTID](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-with-gtid/)
4. [Debezium MySQL Snapshot From Read Replica And Resume From Master](https://thedataguy.in/debezium-mysql-snapshot-from-read-replica-and-resume-from-master/)
5. [Debezium MySQL Snapshot For AWS RDS Aurora From Backup Snaphot](https://thedataguy.in/debezium-mysql-snapshot-for-aws-rds-aurora-from-backup-snaphot/)
6. [RealTime CDC From MySQL Using AWS MSK With Debezium](https://medium.com/searce/realtime-cdc-from-mysql-using-aws-msk-with-debezium-28da5a4ca873)