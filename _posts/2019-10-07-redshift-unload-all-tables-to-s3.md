---
title: RedShift Unload All Tables To S3
date: 2019-10-06T19:40:00.000+00:00
description: Easy way to export or unload all the tables to  S3 from Redshift using
  stored procedure. Also it'll export with partitions in S3
categories:
- AWS
tags:
- aws
- redshift
- s3
- sql
image: "/assets/RedShift Unload All Tables To S3.jpg"

---
RedShift `unload` function will help us to export/unload the data from the tables to S3 directly. It actually runs a select query to get the results and them store them into S3. But unfortunately, it supports only one table at a time. You need to create a script to get the all the tables then store it in a variable, and loop the unload query with the list of tables. Here I have done with PL/SQL way to handle this. You can Export/Unload all the tables to S3 with partitions.

If you didn't take a look at how to export a table with Partition and why? Please [hit here](https://thedataguy.in/redshift-unload-to-s3-with-partitions-stored-procedure-way/) and read about the importance of it.

## Why this procedure actually doing?

1. It will get the list of schema and table in your database from the `information_schema`.
2. Store this information in a variable.
3. IAM role, Partitions are hardcoded, you can customize it or pass them in a variable.
4. A `FOR LOOP` will run the unload query for all the tables.

## Variables:

* list - list of schema and table names in the database.
* db - Current connected database name.
* tablename - table name (used for history table only).
* tableschema - table schema (used for history table only).
* starttime - When the unload the process stated.
* endtime - When the unload process end.
* SQL - its a `select * from`, but if you want to change like `where timestamp >= something` you can customize this variable.
* s3_path - Location of S3, you need to pass this variable while executing the procedure.
* iamrole - IAM role to write into the S3 bucket.
* delimiter - Delimiter for the file.
* max_filesize - Redshift will split your files in S3 in random sizes, you can mention a size for the files.
* un_year, un_month, un_day - Current Year, month, day
* unload_query - Dynamically generate the unload query.
* unload_id - This is for maintaining the history purpose, In one shot you can export all the tables, from this ID, you can get the list of tables uploaded from a particular export operation.
* unload_time - Timestamp of when you started executing the procedure.

> **NOTE**: This stored procedure and the history table needs to installed on all the databases. Because from information schema it'll only return the list of tables in the current schema. Its Redshift's limitation.

### Update 2019-10-08
I have made a small change here, the stored procedure will generate the COPY command as well. You can query the `unload_history` table to get the COPY command for a particular table. So you can easily import the data into any RedShift clusters. 

### Update 2019-11-22
I have published a new blog. You can now export based on your requirements like export only few tables, all tables in a schema, all tables in multiple schema and etc. Click on the below link.
[https://thedataguy.in/redshift-unload-multiple-tables-schema-to-s3/](https://thedataguy.in/redshift-unload-multiple-tables-schema-to-s3/)

## Table for maintaining the History of Unload:

{% highlight sql %}
CREATE TABLE unload_history
(
pid          INT IDENTITY(1, 1),
u_id         INT,
u_timestamp  DATETIME,
start_time   DATETIME,
end_time     DATETIME,
db_name      VARCHAR(100),
table_schema VARCHAR(100),
table_name   VARCHAR(100),
export_query VARCHAR(65000),
import_query VARCHAR(65000)
);
{% endhighlight %}

## Stored Procedure:

{% highlight sql %}
CREATE OR replace PROCEDURE unload_all(s3_location varchar(10000)) LANGUAGE plpgsql
AS
$$
DECLARE
list RECORD;
db        VARCHAR(100);
tablename VARCHAR(100);
tableschema VARCHAR(100);
starttime datetime;
endtime   datetime;
SQL text;
s3_path      VARCHAR(1000);
iamrole      VARCHAR(100);
delimiter    VARCHAR(10);
max_filesize VARCHAR(100);
un_year      INT;
un_month     INT;
un_day       INT;
unload_query varchar(65000);
copy_query   varchar(65000);
unload_id INT;
unload_time timestamp;

      BEGIN 
      
        -- Pass values for the variables 
        SELECT extract(year FROM getdate()) 
        INTO   un_year; 
         
        SELECT extract(month FROM getdate()) 
        INTO   un_month; 
         
        SELECT extract(day FROM getdate()) 
        INTO   un_day; 
         
        SELECT DISTINCT(table_catalog) 
        FROM            information_schema.TABLES 
        INTO            db; 
         
        SELECT coalesce(max(u_id), 0)+1 
        FROM   unload_history 
        INTO   unload_id; 
         
        SELECT getdate() 
        INTO   unload_time; 
         
        s3_path:=s3_location; 
        
        -- IAM ROLE and the Delimiter is hardcoded here
        iamrole:='arn:aws:iam::123123123:role/myredshiftrole'; 
        delimiter:='|'; 
        
        -- Get the list of tables except the unload history table
        FOR list IN 
        SELECT table_schema, 
               table_name 
        FROM   information_schema.TABLES 
        WHERE  table_type='BASE TABLE' 
        AND    table_schema NOT IN ('pg_catalog', 
                                    'information_schema') 
        AND    table_name !='unload_history' LOOP 
        
        SELECT getdate() 
        INTO   starttime; 
         
        sql:='select * from '||list.table_schema||'.'||list.table_name||'' ;
    
        RAISE info '[%] Unloading... schema = % and table = %',starttime, list.table_schema, list.table_name;
        
        -- Start unloading the data 
        unload_query := 'unload ('''||sql||''') to '''||s3_path||un_year||'/'||un_month||'/'||un_day||'/'||db||'/'||list.table_schema||'/'||list.table_name||'/'||list.table_schema||'-'||list.table_name||'_'' iam_role '''||iamrole||''' delimiter '''||delimiter||''' MAXFILESIZE 300 MB PARALLEL ADDQUOTES HEADER GZIP';
        EXECUTE unload_query; 
        
        copy_query := 'copy '||list.table_schema||'.'||list.table_name||' from '''||s3_path||un_year||'/'||un_month||'/'||un_day||'/'||db||'/'||list.table_schema||'/'||list.table_name||'/'' iam_role '''||iamrole||''' delimiter '''||delimiter||''' IGNOREHEADER 1 REMOVEQUOTES gzip';
        
        SELECT getdate() 
        INTO   endtime; 
    
        SELECT list.table_schema 
        INTO tableschema;
    
        SELECT list.table_name 
        INTO tablename;
         
        -- Insert into the history table
        INSERT INTO unload_history 
                    ( 
                                u_id, 
                                u_timestamp, 
                                start_time, 
                                end_time, 
                                db_name, 
                                table_schema,
                                table_name,
                                export_query,
                                import_query 
                    ) 
                    VALUES 
                    ( 
                                unload_id, 
                                unload_time, 
                                starttime, 
                                endtime, 
                                db, 
                                tableschema,
                                tablename,
                                unload_query,
                                copy_query

                    ); 
       
      END LOOP; 
      RAISE info ' Unloading of the DB [%] is success !!!' ,db;
    END; 
    $$;
{% endhighlight %}

## Hardcoded Items:

In the stored procedure, I have hardcoded the follow parameters.

* IAM ROLE - `arn:aws:iam::123123123123:role/myredshiftrole`
* Delimiter - `|`

Also, the following Items are hardcoded in the Unload query. You can get these things as variable or hardcoded as per your convenient.

* MAXFILESIZE  - 100 MB
* PARALLEL
* ADDQUOTES
* HEADER
* GZIP

## Execute the procedure:

    call unload_all('s3://bhuvi-datalake/test/');

You can see the status in the terminal

    INFO:  [2019-10-06 19:20:04] Unloading... schema = etl and table = tbl1
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:10] Unloading... schema = etl and table = tbl2
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:12] Unloading... schema = stage and table = tbl3
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:12] Unloading... schema = stage and table = tbl4
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:14] Unloading... schema = stage and table = tbl5
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:15] Unloading... schema = prod and table = tbl6
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:15] Unloading... schema = prod and table = tbl7
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:15] Unloading... schema = public and table = debug
    INFO:  UNLOAD completed, 0 record(s) unloaded successfully.
    INFO:  [2019-10-06 19:20:16] Unloading... schema = public and table = test
    INFO:  UNLOAD completed, 1 record(s) unloaded successfully.
    INFO:   Unloading of the DB [preprod] is success !!!
    CALL

## Files on S3:

![](/assets/RedShift Unload All Tables To S3_1.jpg)

![](/assets/RedShift Unload All Tables To S3_2.jpg)

## Retrieve the History: 

{% highlight sql %}
preprod=# select * from unload_history limit 1;
    
pid          | 28
u_id         | 1
u_timestamp  | 2019-10-08 10:33:23
start_time   | 2019-10-08 10:33:23
end_time     | 2019-10-08 10:33:23
db_name      | preprod
table_schema | etl
table_name   | tbl2
export_query | unload ('select * from etl.tbl2') to 's3://bhuvi-datalake/test/2019/10/8/preprod/etl/tbl2/etl-tbl2_' iam_role 'arn:aws:iam::123123123:role/myredshiftrole' delimiter '|' MAXFILESIZE 300 MB PARALLEL ADDQUOTES HEADER GZIP
import_query | copy etl.tbl2 from 's3://bhuvi-datalake/test/2019/10/8/preprod/etl/tbl2/' iam_role 'arn:aws:iam::123123123:role/myredshiftrole' delimiter '|' IGNOREHEADER 1 REMOVEQUOTES gzip
{% endhighlight %}