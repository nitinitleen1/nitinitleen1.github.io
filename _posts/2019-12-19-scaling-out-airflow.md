---
title: Setting up an Airflow Cluster
date: 2019-12-19 21:13:00 +0530
description: Airflow Cluster setup with Celery as an executor and PostgresSQL as the backend database.
categories:
- Airflow
tags:
- airflow
- postgresql
- data-pipeline
- aws
- rabbitmq
image: "/assets/airflow-image1.jpeg"

---
Data-driven companies often hinge their business intelligence and product development on the execution of complex data pipelines. These pipelines are often referred to as data workflows, a term that can be somewhat opaque in that workflows are not limited to one specific definition and do not perform a specific set of functions per se. To orchestrate these workflows there are lot of schedulers like oozie, Luigi, Azkaban and Airflow. This blog demonstrate the setup of one of these orchestrator i.e Airflow. 

## A shot intro:

There are many orchestrators which are there in the technology space but Airflow provides a slight edge if our requirement hinges on of the following:

* No cron – With Airflows included scheduler we don't need to rely on cron to schedule our DAG and only use one framework (not like Luigi)
* Code Bases – In Airflow all the workflows, dependencies, and scheduling are done in python code. Therefore, it is rather easy to build complex structures and extend the flows.
* Language – Python is a language somewhat natural to pick up and was available on our team.

However setting up a production grade setup required some effort and this blog address the same.

## Basic Tech Terms:

* **Metastore:** Its a database which stores information regarding the state of tasks. Database updates are performed using an abstraction layer implemented in SQLAlchemy. This abstraction layer cleanly separates the function of the remaining components of Airflow from the database. 
* **Executor**: The Executor is a message queuing process that is tightly bound to the Scheduler and determines the worker processes that actually execute each scheduled task. 
* **Scheduler:** The Scheduler is a process that uses DAG definitions in conjunction with the state of tasks in the metadata database to decide which tasks need to be executed, as well as their execution priority. The Scheduler is generally run as a service.
* **Worker:** These are the processes that actually execute the logic of tasks, and are determined by the Executor being used.

## AWS Architecture: 

![](/assets/airflow-schematic.jpg)

Airflow provides an option to utilize CeleryExecutor to execute tasks in distributed fashion. In this mode, we can run several servers each running multiple worker nodes to execute the tasks. This mode uses Celery along with a message queueing service RabbitMQ.The diagram show the interactivity between different component services i.e. Airflow(Webserver and Scheduler), Celery(Executor) and RabbitMQ and Metastore in an AWS Environment. 

For simplicity of the blog, we will demonstrate the setup of a single node master server and a single node worker server. Below is the following details for the setup: 

* EC2 Master Node - Running Scheduler and Webserver
* EC2 Worker Node - Running Celery Executor and Workers
* RDS Metastore - Storing information about metadata and dag
* EC2 Rabbit MQ Nodes - Running RabbitMq broker

## Enviornment Prerequisite:

* Operating System: Ubuntu 16.04/Ubuntu 18.04 / Debian System
* Python Environment: Python 3.5x
* DataBase: PostgreSql v11.2 (RDS)

Once the prerequisites are taken care of, we can proceed with the installation.

## Installation:

The first step of the setup is the to configure the RDS Postgres database for airflow.
For that we need to connect to RDS Database using using admin user.For the sake of simplicity we are using command line utility from one of the EC2 servers to connect to our RDS Server. For command line client installation for postgres database on debian system execute following commands to install and execute.
 {% highlight shell %}
-- Client Installation
apt-get -y update 
apt-get install postgresql-client
{% endhighlight %}

Once the client is installed try to connect to the Database using the admin user.
 {% highlight shell %}
-- Generating IAM Token
export RDSHOST="{host_name}"
export PGPASSWORD="$(aws rds generate-db-auth-token --hostname $RDSHOST --port 5432 --region{region} --username {admin_user} )"

-- Connecting to the Database
psql "host=hostName port=portNumber dbname=DBName user=userName -password"
{% endhighlight %}

sslmode and sslrootcert parameter is used when we are using SSL/TLS based connection. For more information refere [here](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.Connecting.AWSCLI.PostgreSQL.html).

Once the connection is established with the database create a database named airflow which will act as a primary source where all the metadata,scheduler and other information will be stored by airflow.

{% highlight sql %}
CREATE DATABASE airflow;

CREATE USER {DATABASE_USER} WITH PASSWORD ‘{DATABASE_USER_PASSWORD}’;
GRANT ALL PRIVILEGES ON DATABASE airflow TO {DATABASE_USER};
GRANT CONNECT ON DATABASE airflow TO {DATABASE_USER};
{% endhighlight %}


Once the above step is done the next step is to setup rabbitMQ in one the EC2 server. To install it follow the steps defined below.

1. Login as root
2. Install RabbitMQ Server
3. Verify status
4. Install RabbitMQ Web Interface
{% highlight shell %}
apt-get install rabbitmq-server
rabbitmqctl status
rabbitmq-plugins enable rabbitmq_management
{% endhighlight %}

Enable and start rabbitMQ server and add users and permissions to it.
{% highlight sql %}
-- Enable rabbitMQ server
service rabbitmq-server enable
service rabbitmq-server start
service rabbitmq-server status

-- Add Users and permissions
rabbitmqctl add_user {RABBITMQ_USER} {RABBITMQ_USER_PASSWORD}
rabbitmqctl set_user_tags {RABBITMQ_USER} administrator
{% endhighlight %}

Make Virtual Host and Set Permission for the host.
{% highlight shell %}
rabbitmqctl add_vhost {VIRTUALHOST_NAME}
rabbitmqctl set_permissions -p {VIRTUALHOST_NAME}
{RABBITMQ_USER} “.*” “.*” “.*”
{% endhighlight %}

Download the rabbitadmin utility
{% highlight shell %}
wget http://127.0.0.1:15672/cli/rabbitmqadmin
chmod +x rabbitmqadmin
{% endhighlight %}

One Final step is to make a queue.

{% highlight shell %}
./rabbitmqadmin declare queue –username={RABBITMQ_USER} –password={RABBITMQ_USER_PASSWORD} –vhost={VIRTUALHOST_NAME} name={QUEUE_NAME} durable=true
{% endhighlight %}
We can now access the RabbitMQ UI utility by hitting the public IP at port 15672.

If you someone want to setup multiple machines to work as a RabbitMQ Cluster you can refere [here](https://www.rabbitmq.com/clustering.html).
Now we have all the building blocks. The final step is to setup airflow using celery.

## Setting up of Airflow Using Celery :-

* Install required libraries and dependencies for airflow on each node i.e worker and master.
{% highlight shell %}
apt-get update
apt-get install build-essential
sudo apt-get install python3-pip
apt-get install python-dev python3-dev libsasl2-dev gcc
apt-get install libffi-dev
apt-get install libkrb5-dev
apt-get install python-pandas

-- To get the pip version 
which pip
{% endhighlight %}

* Install airflow and celery on each of the machine.
{% highlight shell %}
pip install pyamqp
pip install psycopg2
pip install apache-airflow[postgres,rabbitmq,celery]
airflow version


--Celery Installation 
pip install celery==4.3.0


-- Initializing airflow
export AIRFLOW_HOME=~/airflow #(provide any directory for airflow home)
airflow initdb
{% endhighlight %}

## Configuration:

We now have airflow installed on all the nodes we have to change but to detect external database and broker we need to do conf changes hence to do that, Edit the `~/airflow/aiflow.cfg` on all the nodes
 {% highlight shell %}
-- On Nodes change following parameters

executor = CeleryExecutor
sql_alchemy_conn = postgresql+psycopg2://airflow:airflow@{HOSTNAME}/airflow 
broker_url= pyamqp://guest:guest@{RabbitMQ-HOSTNAME}:5672/
celery_result_backend = db+postgresql://airflow:airflow@{HOSTNAME}/airflow 
dags_are_paused_at_creation = True
load_examples = False
{% endhighlight %}

Once the changes are done run reload apache to detect those change on each node:
{% highlight shell %}
airflow initdb
{% endhighlight %}

Start webserver and schduler on Master Node and Worker on Second i.e Worker Node and we are done!!!
{% highlight shell %}
-- Node 1 (Master Node)
airflow webserver -p 8000
airflow scheduler

-- Node 2 (Worker Node)
airflow worker
{% endhighlight %}

## More Tuning: 

* **Parallelism** : This parameter determines the maximum number of task instances that can be actively running in parallel across the entire airflow deployment. For example, if it is set to 10 there can’t be more than 10 tasks running irrespective of the number of dags. Hence, this is the maximum number of active tasks at any time. Set it depending upon no of machines in a cluster i.e for one Node 16 is recommended. 
* **Dag Concurrency** : This parameter determines the number of task instances that can be scheduled per DAG. 
* **worker_concurrency** : This parameter determines the number of tasks each worker node can run at any given time. For example, if it is set to 10 then the worker node can concurrently execute 10 tasks that have been scheduled by the schedule. 

## References: 

1. [Making Apache Airflow Highly Available](http://site.clairvoyantsoft.com/making-apache-airflow-highly-available/)
2. [Best Practices for Setup Airflow ](https://docs.qubole.com/en/latest/user-guide/data-engineering/airflow/config-airflow-cluster.html)
3. [Common mistakes while running Multinode Airflow](https://medium.com/@khatri_chetan/challenges-and-struggle-while-setting-up-multi-node-airflow-cluster-7f19e998ebb)
4. [Airflow documentation](https://airflow.apache.org/docs/stable/installation.html)
5. [How to Connect to RDS Postgres](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.Connecting.AWSCLI.PostgreSQL.html)