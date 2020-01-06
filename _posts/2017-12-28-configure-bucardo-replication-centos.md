---
layout: post
title: Configure Bucardo replication on CentOS
date: 2017-12-28 13:21:28.000000000 +00:00
description: This article will explain how to configure Bucardo replication on Centos. Here we were explained to migrate the Postgresql database from on-prem to AWS RDS.
categories:
- PostgreSQL
tags:
- bucardo
- centos
- postgresql
- replication

---

![configure bucardo replication centos]({{ site.baseurl }}/assets/configure-bucardo-replication-centos.png)

I was working with a migration process to migrate the Postgresql Database from Ec2(centos) to AWS RDS. Since I did many migrations to RDS but this is my first migration with Postgresql. The challenge was the source database in Postgresql 9.2 and I wanted to 9.6 on RDS. So decided to configure bucardo replication centos.

Pre-Requirements:
-----------------

-   EC2 instance with CentOs 6.5 (you can use this for centos 6.9, 7.0+)
-   Postgresql 9.2 on CentOs
-   RDS with Postgresql 9.6
-   Connectivity between Ec2 to RDS.
-   Source Database bhuvi.

Now lets kick start the process.

Install Postgresql 9.2:
-----------------------
{% highlight shell %}

rpm -Uvh https://download.postgresql.org/pub/repos/yum/9.2/redhat/rhel-7-x86_64/pgdg-centos92-9.2-3.noarch.rpm
yum install postgresql92 postgresql92-server postgresql92-contrib postgresql-devel postgresql92-plperl
{% endhighlight %}

### Initialize the Postgresql Cluster and start the service:
{% highlight shell %}

/usr/pgsql-9.2/bin/postgresql92-setup initdb
systemctl enable postgresql-9.2.service
systemctl enable postgresql-9.2.service
systemctl start postgresql-9.2.service
{% endhighlight %}

Prepare the Source Database:
----------------------------
{% highlight sql %}

create database bhuvi;
\c bhuvi;
create table source (id int);
insert into source values (1);
insert into source values (2);
insert into source values (3);
insert into source values (4);
insert into source values (5);
{% endhighlight %}

Install dependencies:
---------------------
{% highlight shell %}

sudo yum install perl-DBI perl-DBD-Pg perl-DBIx-Safe postgresql92-plperl perl-version perl-ExtUtils-MakeMaker perl-DBD-Pg perl-Encode-Locale perl-Sys-Syslog perl-Test-Simple perl-Pod-Parser perl-Time-HiRes perl-Readonly

rpm -Uvh http://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/p/perl-boolean-0.30-1.el7.noarch.rpm
{% endhighlight %}

Prepare a Database for Bucardo:
-------------------------------
{% highlight sql %}

CREATE USER bucardo WITH LOGIN SUPERUSER ENCRYPTED PASSWORD 'bucardo-runner';
CREATE DATABASE bucardo;
\c bhuvi;
CREATE EXTENSION plperl;
{% endhighlight %}

Add directories for Bucardo service:
------------------------------------
{% highlight shell %}

sudo mkdir -p /var/log/bucardo /var/run/bucardo
sudo chown -R postgres:postgres /var/log/bucardo /var/run/bucardo
{% endhighlight %}

Install Bucardo Package:
------------------------
{% highlight shell %}

cd /tmp
wget http://bucardo.org/downloads/Bucardo-5.4.1.tar.gz
tar xvfz Bucardo-5.4.1.tar.gz
cd Bucardo-5.4.1
perl Makefile.PL
make
sudo make install
{% endhighlight %}

Source file for Bucardo:
------------------------
{% highlight shell %}

vi $HOME/.bucardorc
dbhost=127.0.0.1
dbname=bucardo
dbport=5432
dbuser=bucardo
{% endhighlight %}

Setup pgpass file:
------------------
{% highlight shell %}

echo "127.0.0.1:5432:bucardo:bucardo:bucardo-runner" > $HOME/.pgpass
chmod 0600 $HOME/.pgpass
{% endhighlight %}

Install bucardo on its own database:
------------------------------------
{% highlight shell %}

./tmp/Bucardo-5.4.1/bucardo install --quiet
{% endhighlight %}

This will ask to verify the configurations, f you see the username or DB name get changes press the num ber you want to change.

Export the Source and Target Database details:
----------------------------------------------
{% highlight shell %}

export SOURCE_HOST=127.0.0.1
export SOURCE_PORT=5432
export SOURCE_DATABASE=bhuvi
export SOURCE_USERNAME=bucardo
export SOURCE_PASSWORD=bucardo

export DEST_HOST=bhuvi.us-east-1.rds.amazonaws.com
export DEST_PORT=5432
export DEST_DATABASE=bhuvi
export DEST_USERNAME=bhuvi
export DEST_PASSWORD=bhu12345

cat >> $HOME/.pgpass <<EOL
$DEST_HOST:$DEST_PORT:$DEST_DATABASE:$DEST_USERNAME:$DEST_PASSWORD
$SOURCE_HOST:$SOURCE_PORT:$SOURCE_DATABASE:$SOURCE_USERNAME:$SOURCE_PASSWORD
EOL
{% endhighlight %}

Export the table that we want to replicate:
-------------------------------------------
{% highlight shell %}

export TABLES_WITH_SPACES="public.source"
{% endhighlight %}

You can use space to add multiple tables.

Take a dump without data:
-------------------------
{% highlight shell %}

pg_dump "host=$SOURCE_HOST port=$SOURCE_PORT dbname=$SOURCE_DATABASE user=$SOURCE_USERNAME" $TABLES --schema-only | grep -v 'CREATE TRIGGER' | grep -v '^--' | grep -v '^$' | grep -v '^SET' | grep -v 'OWNER TO' > schema.sql
{% endhighlight %}

Restore the dump on the target database:
----------------------------------------
{% highlight shell %}

psql "host=$DEST_HOST port=$DEST_PORT dbname=$DEST_DATABASE user=$DEST_USERNAME" -f schema.sql
{% endhighlight %}

Add source and destination database to Bucardo:
-----------------------------------------------
{% highlight shell %}

./bucardo add db source_db dbhost=$SOURCE_HOST dbport=$SOURCE_PORT dbname=$SOURCE_DATABASE dbuser=$SOURCE_USERNAME dbpass=$SOURCE_PASSWORD
./bucardo add db dest_db dbhost=$DEST_HOST dbport=$DEST_PORT dbname=$DEST_DATABASE dbuser=$DEST_USERNAME dbpass=$DEST_PASSWORD
{% endhighlight %}

Add tables to the Bucardo:
--------------------------
{% highlight shell %}

./bucardo add tables $TABLES_WITH_SPACES db=source_db
./bucardo add herd copying_herd $TABLES_WITH_SPACES
{% endhighlight %}

Start Sync the tables:
----------------------
{% highlight shell %}

./bucardo add sync the_sync relgroup=copying_herd dbs=source_db:source,dest_db:target onetimecopy=2
./bucardo start
{% endhighlight %}

Yeah!!! we are done. Query the Target table and you can see the data there.