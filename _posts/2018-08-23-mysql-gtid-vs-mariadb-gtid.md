---
layout: post
title: MySQL GTID vs MariaDB GTID
date: 2018-08-23 19:48:53.000000000 +00:00
description: MySQL and MariaDB has their own method of GTID, in this blog I have explained the GTID on MySQL and MariaDB and how this works on binlog.
categories:
- MySQL
tags:
- mariadb
- mysql
- replication

---
MySQL supports three types for binlog format. For safer binlog based replication its recommended to use ROW based replication. But even though in some worst cases this leads to data inconsistency. Later MySQL came up with the concept of GTID (global transaction identifiers) which generates the unique binlog entries to avoid any data inconsistency. This feature supports in MySQL 5.6+. Percona MySQL Servers is also using the same structure of MySQL's  GTID. But MariaDB GTID is bit different.

![MySQL GTID vs MariaDB GTID-cover]({{ site.baseurl }}/assets/MySQL-GTID-vs-MariaDB-GTID-cover.png)

As a DBA, I worked a lot in MySQL replication and troubleshooting but not much with GTID. I got stuck with a migration because of this GTID. Then I have confirmed the possibilities with one my [Friend from mydbops](https://www.linkedin.com/in/prkart/). Then I started to understand deeply about this GTID in MySQL and MariaDB. After that I taught it worth to share.

What is the Purpose of GTID?
----------------------------

GTID will generate a globally unique transaction ID for each transaction. Lets see a simple example. You are going to replicate a Database from Server M to Server S. You have been set the Master binlog as binlog-00001 and its position as 120. Somehow after the binlog position 150, the replication got break, so by mistake you have mentioned to start replication from 120. This will re-apply all the transactions from binlog position 120. This may lead to duplicate records.  

But GTID has an unique ID for each transaction, If you start replication with the GTID XXX:120 then the slave will start keep track on the applied GTID. So again if we start to re-apply the transaction, it'll not accept those records. 

GTID in MySQL:
--------------

In MySQL, there are two portions for GTID. The first portion refers to the Server UUID. This UUID is a 32 Character Random string. This value is taken from the auto.cnf file which is located in mysql data directory. The second portion is for sequence.

**Example: **
{% highlight shell %}
2defbe5b-a6b7-11e8-8882-42010a8e0008:10
{% endhighlight %}

If you have a single master, then in slave the GTID has represented as single expression.

**Example:**
{% highlight shell %}
2defbe5b-a6b7-11e8-8882-42010a8e0008:1-10
{% endhighlight %}


This refers that the transaction 1 to 10 has been originated from the Server which has the UUID as `2defbe5b-a6b7-11e8-8882-42010a8e0008`.

### Lets to some tests:

Prepare a database with a table.  

{% highlight sql %}
mysql -u root -ppass
create database sqladmin;

use sqladmin
create table binlog (number int);

mysql> insert into binlog values (1);
Query OK, 1 row affected (0.03 sec)

mysql> insert into binlog values (2);
Query OK, 1 row affected (0.01 sec)

mysql> insert into binlog values (3);
Query OK, 1 row affected (0.02 sec)
{% endhighlight %}


Now open your binlog file with the following command.

{% highlight shell %}
mysqlbinlog mysql-bin-00001 --base64-output=DECODE-ROWS --verbose

#180823 15:39:43 server id 1111  end_log_pos 124 CRC32 0x0d3ba090       Start: binlog v 4, server v 8.0.12 created 180823 15:39:43 at startup

SET @@SESSION.GTID_NEXT= '2defbe5b-a6b7-11e8-8882-42010a8e0008:8'/*!*/;
#180823 15:40:14 server id 1111  end_log_pos 349 CRC32 0x3d311ee1       Query   thread_id=8     exec_time=0     error_code=0

BEGIN
#180823 15:40:14 server id 1111  end_log_pos 445 CRC32 0xf547477c       Write_rows: table id 66 flags: STMT_END_F
### INSERT INTO `sqladmin`.`binlog`
### SET
###   @1=1
# at 445
#180823 15:40:14 server id 1111  end_log_pos 476 CRC32 0x2fb15a52       Xid = 9
COMMIT/*!*/;

SET @@SESSION.GTID_NEXT= '2defbe5b-a6b7-11e8-8882-42010a8e0008:9'/*!*/;
#180823 15:40:17 server id 1111  end_log_pos 630 CRC32 0x26771dff       Query   thread_id=8     exec_time=0     error_code=0

BEGIN
#180823 15:40:17 server id 1111  end_log_pos 726 CRC32 0x7b5b1883       Write_rows: table id 66 flags: STMT_END_F
### INSERT INTO `sqladmin`.`binlog`
### SET
###   @1=2
# at 726
#180823 15:40:17 server id 1111  end_log_pos 757 CRC32 0x8d0cdb14       Xid = 10
COMMIT/*!*/;

SET @@SESSION.GTID_NEXT= '2defbe5b-a6b7-11e8-8882-42010a8e0008:10'/*!*/;
#180823 15:40:19 server id 1111  end_log_pos 911 CRC32 0x3c7ef0dc       Query   thread_id=8     exec_time=0     error_code=0

BEGIN
#180823 15:40:19 server id 1111  end_log_pos 1007 CRC32 0xbd02976b      Write_rows: table id 66 flags: STMT_END_F
### INSERT INTO `sqladmin`.`binlog`
### SET
###   @1=3
# at 1007
#180823 15:40:19 server id 1111  end_log_pos 1038 CRC32 0x1a7f559f      Xid = 11
COMMIT/*!*/;

#180823 15:40:40 server id 1111  end_log_pos 1113 CRC32 0xbd91558b      GTID    last_committed=3        sequence_number=4       rbr_only=yes    original_committed_timestamp=1535038840931969 immediate_commit_timestamp=1535038840931969      transaction_length=473
SET @@SESSION.GTID_NEXT= '2defbe5b-a6b7-11e8-8882-42010a8e0008:11'/*!*/;
#180823 15:40:29 server id 1111  end_log_pos 1192 CRC32 0x66184d4c      Query   thread_id=8     exec_time=0     error_code=0
BEGIN
#180823 15:40:29 server id 1111  end_log_pos 1248 CRC32 0x3ecc40d8      Table_map: `sqladmin`.`binlog` mapped to number 66
#180823 15:40:29 server id 1111  end_log_pos 1288 CRC32 0x91460ce6      Write_rows: table id 66 flags: STMT_END_F
### INSERT INTO `sqladmin`.`binlog`
### SET
###   @1=4
### INSERT INTO `sqladmin`.`binlog`
### SET
###   @1=5
### INSERT INTO `sqladmin`.`binlog`
### SET
###   @1=6
#180823 15:40:40 server id 1111  end_log_pos 1511 CRC32 0x8f1c4a0a      Xid = 13
COMMIT/*!*/;
SET @@SESSION.GTID_NEXT= 'AUTOMATIC' /* added by mysqlbinlog */ /*!*/;
DELIMITER ;
# End of log file
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
{% endhighlight %}


![MySQL GTID vs MariaDB GTID-1]({{ site.baseurl }}/assets/MySQL-GTID-vs-MariaDB-GTID-1.jpg)

Limitations:
------------

-   If you are using Mysql 5.6, then you must need to restart to enable the GTID.
-   Mysql 5.7 we can do that in online.
-   If you are using replication without GTID, then you need to enable the GTID on the Master, then Slave.
-   On Master and Slave, you should have different UUID in the *auto.cnf*

GTID in MariaDB
---------------

Unlike MySQL, MariaDB has implemented a new type of GTID, it has 3 portions. We don't want to restart the to enable GTID in MariaDB.

![]({{ site.baseurl }}/assets/MySQL-GTID-vs-MariaDB-GTID-2.png)

Source: MariaDB

### Domain ID:

If you are using multi-master replication, lets say 3 node setup. The each group commit order should be ordered in the binlog on other servera. You are inserting the 3 records on each node. Due to some network issues, the Node 3 has disconnected, mean while Node 2 executed the drop table command and some sessions are inserting some data on the Node 3. When the network issue is resolved then the Node 3 will lose its track that where it should replicate the data and which node's data should be applied first. This Domain ID will solve this. So the slave has to know where to start the transaction for Node 1 and Node 2.

### Server ID:

This is the mysql's parameter server-id. This is its second portion  where the event group is first logged into the binlog. 

### Sequence:

This is same as MySQL's sequence order.

Testing with MariaDB:
---------------------

{% highlight sql %}
mysql -u root -ppass

create database sqladmin_mariadb;
use sqladmin_mariadb;

create table binlog_mariadb (number int);

MariaDB [sqladmin_mariadb]> insert into binlog_mariadb values (1);
Query OK, 1 row affected (0.004 sec)

MariaDB [sqladmin_mariadb]> insert into binlog_mariadb values (2);
Query OK, 1 row affected (0.003 sec)

MariaDB [sqladmin_mariadb]> insert into binlog_mariadb values (3);
Query OK, 1 row affected (0.003 sec)

MariaDB [sqladmin_mariadb]> start transaction;
Query OK, 0 rows affected (0.000 sec)

MariaDB [sqladmin_mariadb]> insert into binlog_mariadb values (4);
Query OK, 1 row affected (0.000 sec)

MariaDB [sqladmin_mariadb]> insert into binlog_mariadb values (5);
Query OK, 1 row affected (0.000 sec)

MariaDB [sqladmin_mariadb]> insert into binlog_mariadb values (6);
Query OK, 1 row affected (0.000 sec)

MariaDB [sqladmin_mariadb]> commit;
Query OK, 0 rows affected (0.003 sec)
{% endhighlight %}

Check the Binlog file:

{% highlight shell %}
mysqlbinlog mariadb-bin-00001 --base64-output=DECODE-ROWS --verbose

#180823 11:52:51 server id 2222  end_log_pos 344 CRC32 0xb2ca091b       Binlog checkpoint mariadb-bin.000007
#180823 11:53:37 server id 2222  end_log_pos 386 CRC32 0x6144b742       GTID 0-2222-8 trans

BEGIN
#180823 11:53:37 server id 2222  end_log_pos 502 CRC32 0xfe8cf324       Query   thread_id=39    exec_time=0     error_code=0
use `sqladmin_mariadb`/*!*/;
insert into binlog_mariadb values (1)
#180823 11:53:37 server id 2222  end_log_pos 533 CRC32 0x97697a74       Xid = 64
COMMIT/*!*/;
#180823 11:53:40 server id 2222  end_log_pos 575 CRC32 0x0fae8fd8       GTID 0-2222-9 trans
BEGIN
insert into binlog_mariadb values (2)
#180823 11:53:40 server id 2222  end_log_pos 722 CRC32 0xf309b83d       Xid = 65
COMMIT/*!*/;

#180823 11:53:43 server id 2222  end_log_pos 764 CRC32 0xc2fa150f       GTID 0-2222-10 trans
BEGIN
#180823 11:53:43 server id 2222  end_log_pos 880 CRC32 0x37365c4e       Query   thread_id=39    exec_time=0     error_code=0
insert into binlog_mariadb values (3)
#180823 11:53:43 server id 2222  end_log_pos 911 CRC32 0x8375f05e       Xid = 66
COMMIT/*!*/;

#180823 11:54:23 server id 2222  end_log_pos 953 CRC32 0x7653ab71       GTID 0-2222-11 trans
BEGIN
# at 953
#180823 11:54:14 server id 2222  end_log_pos 1069 CRC32 0x88969c27      Query   thread_id=39    exec_time=0     error_code=0
insert into binlog_mariadb values (4)
#180823 11:54:17 server id 2222  end_log_pos 1185 CRC32 0x2d95ef77      Query   thread_id=39    exec_time=0     error_code=0
insert into binlog_mariadb values (5)
#180823 11:54:20 server id 2222  end_log_pos 1301 CRC32 0xda32e39a      Query   thread_id=39    exec_time=0     error_code=0
insert into binlog_mariadb values (6)
#180823 11:54:23 server id 2222  end_log_pos 1332 CRC32 0xfc09369f      Xid = 68
COMMIT/*!*/;
{% endhighlight %}

![MySQL GTID vs MariaDB GTID-3]({{ site.baseurl }}/assets/MySQL-GTID-vs-MariaDB-GTID-3.jpg)

Conclusion:
-----------

Lessons I learned from the GTID:

-   MariaDB to MySQL replication is not possible with GTID.
-   In MySQL master/slave all nodes must have GTID. You can't enable it on one single node.
-   MySQL to MariaDB replication possible where GTID enabled on MySQL.

Interesting Read:
-----------------

Jean-François Gagné -- Has done the GTID  without restart the MySQL 5.6. They used some custom patched version of MySQL. You can read it from [this link](https://medium.com/booking-com-infrastructure/mysql-5-6-gtids-evaluation-and-online-migration-139693719ff2).
