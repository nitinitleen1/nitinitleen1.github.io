---
layout: post
title: Archive MySQL Data In Chunks Using Stored Procedure
date: 2018-09-26 13:12:25.000000000 +00:00
description: This article explains archive a huge table in chunks and also take a backup before archive. Its a shell script and you can customize.

categories:
- MySQL
tags:
- archive
- automation
- mysql
- shell

---
In a DBA's day to day activities, we are doing Archive operation on our transnational database servers to improve your queries and control the Disk space. The archive is a most expensive operation since its involved a huge number of Read and Write will be performed. So its mandatory to run the archive queries in chunks. The archive is depended on business use. Many of us need a copy of the data on an archive database to refer later. To perform the archive we can just simply run the delete query with the limit. But we need to run the query again and again until the matched rows count is 0. We can create a procedure to do this in a while loop. I have created one such procedure to archive many tables. 

![MySQL Stored Procedure To Archive In Chunks]({{ site.baseurl }}/assets/MySQL-Stored-Procedure-To-Archive-In-Chunks.jpg)

Image Source: Brent Ozar Unlimited

Why Archive is an expensive operation? 
---------------------------------------

Generally how we are arching the data is *delete from table_name where column_name <= some_value;* If you are running on a table which needs to be deleted around 15million records, then you need the undo log file to hold all of these records. There will be a heavy IO happening in the Disk. And lt'll lock the rows and some other locks will be held until the Archive complete. Replication may delay because of this. 

When Archive is going to mess up the production?
------------------------------------------------

-   Running archive commands on a heavy traffic time.
-   Archive without a proper where clause.
-   Delete data without limit.
-   Performing archive contrition on a not indexed column. 
-   Continuously run the delete query in chunks on a replication environment. {without sleep(1 or few seconds}.

How to perform the archive properly? 
-------------------------------------

-   To do this, the first condition is use limit in the delete.
-   Create an index on the where clause.
-   At least do sleep 1sec for each chuck which will be good for a replication infra.
-   Set autocommit=1
-   Optional: Set transaction isolation to Read Committed.
-   Do not mention the number of loops without knowing the actual loop counts to process the complete delete.

My approach to this:
--------------------

Inspired by Rick James's [Blog](http://mysql.rjweb.org/doc.php/deletebig), I have prepared a single stored procedure to perform archive on multiple tables. We just need to pass the table name, date column and then date to archive. I have tested with datetime and Primary key column. 

Archive a single table:
-----------------------

The below procedure will perform delete on table test and remove older than 10 days records. 
{% highlight sql %}

use sqladmin;

DROP PROCEDURE
IF EXISTS archive;
delimiter //
  CREATE PROCEDURE
    archive()
  begin
    DECLARE rows INT;
    DECLARE rows_deleted INT;
    SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
    SET rows = 1;
    SET rows_deleted = 10000;
    WHILE rows > 0
    do
    SET autocommit=1;
    DELETE
    FROM   test
    WHERE  dop < DATE(Date_sub(Now(), INTERVAL 10 day))
    LIMIT  10000;
    SET rows = row_count();
    select sleep(1);
    commit;
    END WHILE;
    END //
delimiter ;
{% endhighlight %}

Archive multiple tables:
------------------------

This procedure will help you to archive multiple tables, you just need to pass the table name, column name and the date for the archive. I love to use this.
{% highlight sql %}

use sqladmin;

DROP PROCEDURE
IF EXISTS sqladmin_archive;
delimiter //
  CREATE PROCEDURE
    sqladmin_archive(IN archive_dbname varchar(100), IN archive_table varchar(100), IN archive_column varchar(100), IN archive_date varchar(100))

  begin
    DECLARE rows INT;
    DECLARE rows_deleted INT;
    SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
    SET rows = 1;
    SET rows_deleted = 10000;
    WHILE rows > 0
        do
        SET autocommit=1;
        SET @query =CONCAT('DELETE FROM   ',archive_dbname,'.',archive_table,' WHERE  ',archive_column,' <= "',archive_date ,'" LIMIT  10000;');
        PREPARE arcive_stmt FROM @query;
        EXECUTE arcive_stmt;
        SET rows = row_count();
        SET rows = row_count();
    select sleep(1);
   commit;
   DEALLOCATE PREPARE arcive_stmt;
  END WHILE;
 END //
delimiter ;

-- Execute this procedure
CALL sqladmin_archive ('mydb','test_table','created_at','2018-09-12');
{% endhighlight %}

Take dump before archive with where clause:
-------------------------------------------

This script is my favorite one, but this depends on the above stored procedure. This shell script will take the dump of the table with where clause of the date that we want to archive. You can customize this as per your requirement.
{% highlight shell %}

#!/bin/bash

# pass variables
archive_dbname=$1
archive_table=$2
archive_column=$3
days_to_archive=$4
archive_date="'"`date +'%Y-%m-%d' --date="-$days_to_archive day"`"'"
where_clause=$archive_column'<='$archive_date
dump_file=$archive_table_`date +'%Y-%m-%d' --date="-$days_to_archive day"`".sql"

# Dump the table
echo "DUMP Starting for the table $archive_table ....."
mysqldump -u root $archive_dbname $archive_table --where=$where_clause > $dump_file
echo "DUMP Done......"

# Archive the data
echo "Deleting the data on the table $archive_table ....."
mysql -u root sqladmin -e"CALL sqladmin_archive('$archive_dbname','$archive_table','$archive_column',$archive_date);"
echo "Deleting is Done ....."
{% endhighlight %}

Example Archive:
----------------

This example, Im going to archive a table called test. The column started_at contains the timestamp value. I want to remove older than 15 days data in the table. This table is located in the database name called sqladmin.
{% highlight shell %}
./archive_script.sh sqladmin test started_at 15
{% endhighlight %}

