---
title: MySQL Exact Row Count For All The Tables
date: 2019-02-25 11:35:00 +0000
description: Use this stored procedure to get the exact row count of all the tables
  in mysql. Get the table names using cursor and run select count.
categories:
- mysql
tags:
- mysql
- " shellscript"
title_image: "/uploads/MySQL Exact Row Count For All The Tables.jpg"

---
![MySQL Exact Row Count For All The Tables](/uploads/MySQL Exact Row Count For All The Tables.jpg "MySQL Exact Row Count For All The Tables")

Getting the row count from mysql tables are not a big deal and even there is no need for a blog for this. Simply go and query the `INFORMATION``_SCHEMA` _and get the row count for the tables. But this is not your actual row counts. It'll show the row count of the tables during the last statistics update. So if you want to track your tables growth then you should do_ `select count(*) from table_name` for all the tables and insert the results to somewhere. There are a lot of ways available. Im just make this as a blog post. So others can benefit from it.

## Row Count - From Stored Procedure:

We'll get the list of table names from the `information_schema` and use `cursor` to run `select count(*)` on that table and save the row count value to a table.

In this example, Im going to collect the row count of the tables from the database called `prod_db`. And this procedure and tracking table will be saved on the database called `dbadmin`.

{% highlight sql %}

use dbadmin;

CREATE TABLE table_growth (  
id INT (11) NOT NULL AUTO_INCREMENT  
,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP  
,table_name VARCHAR(50) DEFAULT NULL  
,rows INT (11) DEFAULT NULL  
,PRIMARY KEY (id)  
);

delimiter //  
CREATE PROCEDURE rows_growth()  
BEGIN  
DECLARE start INTEGER DEFAULT 0;  
DECLARE t_name varchar(255);  
DEClARE table_names CURSOR FOR  
    	SELECT table_name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='prod_db';  
DECLARE CONTINUE HANDLER  
        FOR NOT FOUND SET start=1;  
OPEN table_names;  
get_tablename: table_name  
FETCH table_names INTO t_name;  
SET @query =CONCAT('insert into table_growth (table_name, rows)  select "',t_name,'" as tablename ', ',', 'count(*) from prod_db.', t_name);  
select @query;  
PREPARE insert_stmt FROM @query;  
EXECUTE insert_stmt;  
IF start = 1 THEN  
LEAVE get_tablename;  
END IF;  
END table_name get_tablename;  
CLOSE table_names;  
END//  
delimiter ;

{% endhighlight %}

## Row Count - From Shell Script

{% highlight shell %}

mysql  -h IP_ADDRESS -usqladmin  -p'password!' Foodie  -N -e "SELECT table_name FROM INFORMATION_SCHEMA.tables where table_schema='Foodie';" | while read -r table_name  
do  
count=$(mysql -h IP_ADDRESS -usqladmin  -p'password' Foodie -N -e "SELECT COUNT(*) FROM $table_name;")  
mysql  -h IP_ADDRESS -usqladmin  -p'pass!'  dbadmin -e "INSERT INTO table_growth (table_name, rows)  VALUES ('$table_name',$count);"  
done

{% endhighlight %}

If your tables are having a huge amount of data and running with one or two read replica, then use replica's IP address for doing the `select count(*)`.