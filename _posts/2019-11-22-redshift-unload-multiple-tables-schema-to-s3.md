---
title: RedShift Unload Like A Pro - Multiple Tables And Schemas
date: 2019-11-22 10:05:00 +0530
description: In this blog we used a stored procedure to Unload multiple tables, specific
  or all the schema or all the tables in all schema to S3.
categories:
- AWS
tags:
- aws
- redshift
- unload
- s3
- sql
image: "/assets/RedShift Unload Like A Pro - Multiple Tables And Schemas.jpg"

---
In my [previous post](https://thedataguy.in/redshift-unload-all-tables-to-s3/), I explained how to unload all the tables in the RedShift database to S3 Bucket. But there was a limitation. We should export all the tables, you can't specify some list of tables or all the tables in a specific schema. Its because of I can't give comma separated values in RedShift stored procedure. But after spending few days I found a solution for this.

## What we'll achieve here?

* Unload many tables to S3.
* Unload all the tables in a specific schema.
* Unload specific tables in any schema.
* All the tables in all the schema.

## Stored Procedure:

You can refer my previous post to understand how it works and the meaning for the variables I used.

**Arguments Used:**

* s3_path - Location to export the data.
* schema_name - Export the tables in this schema.
* table_list - List of tables to export.

To understand all other parameters read my [previous post](https://thedataguy.in/redshift-unload-all-tables-to-s3/).

**Hardcoded Items:** 

In the stored procedure, I have hardcoded the follow parameters.

* IAM ROLE - `arn:aws:iam::123123123123:role/myredshiftrole`
* Delimiter - `|`

**You can customize:**

Also, the following Items are hardcoded in the Unload query. You can get these things as variable or hardcoded as per your convenient.

* MAXFILESIZE - 100 MB
* PARALLEL
* ADDQUOTES
* HEADER
* GZIP

**Create a table for maintain the unload history:**
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

**Stored Procedure:**
{% highlight sql %}
    CREATE OR replace PROCEDURE unload_pro(s3_location VARCHAR(10000), 
                                                   schema_list VARCHAR(100), 
                                                   table_list  VARCHAR(1000)) 
    LANGUAGE plpgsql 
    AS 
      $$ 
      DECLARE 
        list RECORD; 
        db          VARCHAR(100); 
        tablename   VARCHAR(100); 
        tableschema VARCHAR(100); 
        starttime   datetime; 
        endtime     datetime; 
        SQL text; 
        s3_path      VARCHAR(1000); 
        iamrole      VARCHAR(100); 
        delimiter    VARCHAR(10); 
        max_filesize VARCHAR(100); 
        un_year      INT; 
        un_month     INT; 
        un_day       INT; 
        unload_query VARCHAR(65000); 
        copy_query   VARCHAR(65000); 
        unload_id    INT; 
        unload_time timestamp; 
        sc_name  VARCHAR(100); 
        tbl_list VARCHAR(1000); 
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
        iamrole:='arn:aws:iam::123123123123:role/myredshiftrole'; 
        
        delimiter:='|'; 
        
        IF schema_list IS NULL THEN 
          DROP TABLE IF EXISTS sp_tmp_schemalist; 
           
          CREATE temp TABLE sp_tmp_schemalist (sc_list VARCHAR(100)); 
          INSERT INTO sp_tmp_schemalist 
          SELECT   nspname 
          FROM     pg_class pc 
          join     pg_namespace pn 
          ON       pc.relnamespace = pn.oid 
          WHERE    nspname NOT IN ( 'pg_catalog', 
                                   'information_schema', 
                                   'pg_toast') 
          AND      nspname NOT LIKE 'pg_%' 
          GROUP BY nspname; 
           
          SELECT   listagg(sc_list, ',') within GROUP (ORDER BY sc_list) 
          FROM     sp_tmp_schemalist 
          INTO     sc_name; 
         
        ELSE 
          sc_name:=schema_list; 
        END IF; 
        
        IF table_list IS NULL THEN 
          DROP TABLE IF EXISTS sp_tmp_tablelist; 
           
          CREATE temp TABLE sp_tmp_tablelist (tbl_name VARCHAR(100)); 
          INSERT INTO sp_tmp_tablelist 
          SELECT relname 
          FROM   pg_class pc 
          join   pg_namespace pn 
          ON     pc.relnamespace = pn.oid 
          WHERE  nspname NOT IN ( 'pg_catalog', 
                                 'information_schema', 
                                 'pg_toast' ) 
          AND    relname NOT LIKE 'sp_tmp_%'; 
           
          SELECT   listagg(tbl_name, ',') within GROUP (ORDER BY tbl_name) 
          FROM     sp_tmp_tablelist 
          INTO     tbl_list; 
         
        ELSE 
          tbl_list:=table_list; 
        END IF; 
        
        DROP TABLE IF EXISTS sp_tmp_quote_schema; 
        DROP TABLE IF EXISTS sp_tmp_quote_table; 
        DROP TABLE IF EXISTS sp_tmp_token_schema; 
        DROP TABLE IF EXISTS sp_tmp_token_table; 
         
        CREATE TABLE sp_tmp_quote_schema 
                     ( 
                                  comma_quote_schema VARCHAR(400) 
                     ); 
         
        CREATE TABLE sp_tmp_quote_table 
                     ( 
                                  comma_quote_table VARCHAR(400) 
                     ); 
         
        
        EXECUTE 'INSERT INTO sp_tmp_quote_schema VALUES ('|| quote_literal(sc_name)|| ')'; 
        EXECUTE 'INSERT INTO sp_tmp_quote_table VALUES ('|| quote_literal(tbl_list)|| ')'; 
        
        DROP TABLE IF EXISTS sp_tmp_ns; 
        CREATE temp TABLE sp_tmp_ns (n INT); 
        
        INSERT INTO sp_tmp_ns 
        SELECT 
          ROW_NUMBER() OVER () as n
        FROM 
             (SELECT 0 as n UNION SELECT 1) p0,
             (SELECT 0 as n UNION SELECT 1) p1,
             (SELECT 0 as n UNION SELECT 1) p2,
             (SELECT 0 as n UNION SELECT 1) p3,
             (SELECT 0 as n UNION SELECT 1) p4,
             (SELECT 0 as n UNION SELECT 1) p5,
             (SELECT 0 as n UNION SELECT 1) p6,
             (SELECT 0 as n UNION SELECT 1) p7,
             (SELECT 0 as n UNION SELECT 1) p8,
             (SELECT 0 as n UNION SELECT 1) p9,
             (SELECT 0 as n UNION SELECT 1) p10;
         
        SELECT     trim(split_part(b.comma_quote_schema, ',', ns.n)) AS sname 
        INTO       TABLE sp_tmp_token_schema 
        FROM       sp_tmp_ns ns 
        inner join sp_tmp_quote_schema b 
        ON         ns.n <= regexp_count(b.comma_quote_schema, ',') + 1; 
         
        SELECT     trim(split_part(b.comma_quote_table, ',', ns.n)) AS tname 
        INTO       TABLE sp_tmp_token_table 
        FROM       sp_tmp_ns ns 
        inner join sp_tmp_quote_table b 
        ON         ns.n <= regexp_count(b.comma_quote_table, ',') + 1; 
         
        FOR list IN 
        SELECT nspname :: text AS table_schema, 
               relname :: text AS table_name 
        FROM   pg_class pc 
        join   pg_namespace pn 
        ON     pc.relnamespace = pn.oid 
        WHERE  trim(relname :: text) IN 
               ( 
                      SELECT tname 
                      FROM   sp_tmp_token_table) 
        AND    relname !='unload_history' 
        AND    trim(nspname :: text) IN 
               ( 
                      SELECT sname 
                      FROM   sp_tmp_token_schema) LOOP 
        SELECT getdate() 
        INTO   starttime; 
         
        SQL:='select * from ' 
        ||list.table_schema 
        ||'.' 
        ||list.table_name 
        ||'' ; 
        RAISE info '[%] Unloading... schema = % and table = %',starttime, list.table_schema, list.table_name;
        -- Start unloading the data 
        unload_query := 'unload (''' 
        ||SQL 
        ||''') to ''' 
        ||s3_path 
        ||un_year 
        ||'/' 
        ||un_month 
        ||'/' 
        ||un_day 
        ||'/' 
        ||db 
        ||'/' 
        ||list.table_schema 
        ||'/' 
        ||list.table_name 
        ||'/' 
        ||list.table_schema 
        ||'-' 
        ||list.table_name 
        ||'_'' iam_role ''' 
        ||iamrole 
        ||''' delimiter ''' 
        ||delimiter 
        ||''' MAXFILESIZE 300 MB PARALLEL ADDQUOTES HEADER GZIP'; 
        
        EXECUTE unload_query; 
        
        copy_query := 'copy ' 
        ||list.table_schema 
        ||'.' 
        ||list.table_name 
        ||' from ''' 
        ||s3_path 
        ||un_year 
        ||'/' 
        ||un_month 
        ||'/' 
        ||un_day 
        ||'/' 
        ||db 
        ||'/' 
        ||list.table_schema 
        ||'/' 
        ||list.table_name 
        ||'/'' iam_role ''' 
        ||iamrole 
        ||''' delimiter ''' 
        ||delimiter 
        ||''' IGNOREHEADER 1 REMOVEQUOTES gzip'; 
        
        SELECT getdate() 
        INTO   endtime; 
         
        SELECT list.table_schema 
        INTO   tableschema; 
         
        SELECT list.table_name 
        INTO   tablename; 
         
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

I have less than 2048 tables, if you have more than that, just add few more `select unions` in the below portion.

{% highlight sql %}
    SELECT 
          ROW_NUMBER() OVER () as n
        FROM 
             (SELECT 0 as n UNION SELECT 1) p0,
             (SELECT 0 as n UNION SELECT 1) p1,
             .....
             (SELECT 0 as n UNION SELECT 1) p15,
             ......
             (SELECT 0 as n UNION SELECT 1) p20,
{% endhighlight %}

## Tables in my Redshift database:

{% highlight sql %}
     table_schema |     table_name
    --------------+---------------------
     sc1          | tbl1
     sc1          | tbl2
     sc1          | tbl3
     sc2          | tbl4
     sc2          | tbl5
     sc2          | tbl6
     sc3          | tbl7
     sc3          | tbl8
     sc3          | tbl9
     public       | new1
     public       | new2
     public       | new3
     public       | my_tokenized_tables
     public       | ns
     public       | nsa
{% endhighlight %}

## Example Commands:

**Export all the tables in the schema sc1:**
{% highlight sql %}
    stg=# call unload_pro('s3://datalake/test/','sc1',NULL);
    INFO:  [2019-11-22 04:02:49] Unloading... schema = sc1 and table = tbl2
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:02:52] Unloading... schema = sc1 and table = tbl1
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:02:52] Unloading... schema = sc1 and table = tbl3
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:   Unloading of the DB [stg] is success !!!
    CALL
{% endhighlight %}
**Export all the tables in the schema sc3,public:**
{% highlight sql %}
    stg=# call unload_pro('s3://datalake/test/','sc3,public',NULL);
    INFO:  [2019-11-22 04:03:23] Unloading... schema = sc3 and table = tbl7
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:23] Unloading... schema = sc3 and table = tbl9
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:23] Unloading... schema = public and table = new2
    INFO:  UNLOAD completed, 0 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:24] Unloading... schema = public and table = my_tokenized_tables
    INFO:  UNLOAD completed, 2 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:24] Unloading... schema = public and table = nsa
    INFO:  UNLOAD completed, 0 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:24] Unloading... schema = sc3 and table = tbl8
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:25] Unloading... schema = public and table = new1
    INFO:  UNLOAD completed, 0 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:25] Unloading... schema = public and table = new3
    INFO:  UNLOAD completed, 0 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:03:25] Unloading... schema = public and table = ns
    INFO:  UNLOAD completed, 0 record(s) unloaded successfully.
    INFO:   Unloading of the DB [stg] is success !!!
    CALL
{% endhighlight %}
**Export the tables tbl1, tbl2 in the schema sc1:**
{% highlight sql %}
    stg=# call unload_pro('s3://datalake/test/','sc1','tbl1,tbl2');
    INFO:  [2019-11-22 04:04:05] Unloading... schema = sc1 and table = tbl1
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:04:06] Unloading... schema = sc1 and table = tbl2
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:   Unloading of the DB [stg] is success !!!
    CALL
{% endhighlight %}
**Export the tbl4, tbl5 without specifying any schema name: (but if you have multiple tables in the same name, all tables will be exported )**
{% highlight sql %}
    stg=# call unload_pro('s3://datalake/test/',NULL,'tbl4,tbl5');
    INFO:  [2019-11-22 04:04:42] Unloading... schema = sc2 and table = tbl4
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:04:42] Unloading... schema = sc2 and table = tbl5
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:   Unloading of the DB [stg] is success !!!
    CALL
{% endhighlight %}
**Export all the tables in all the schemas:**
{% highlight sql %}
    stg=# call unload_pro('s3://datalake/test/',NULL,NULL);
    INFO:  [2019-11-22 04:05:23] Unloading... schema = sc1 and table = tbl2
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:05:23] Unloading... schema = sc2 and table = tbl4
    INFO:  UNLOAD completed, 3 record(s) unloaded successfully.
    INFO:  [2019-11-22 04:05:24] Unloading... schema = sc2 and table = tbl6
    ...................
    ...................
    INFO:  [2019-11-22 04:05:28] Unloading... schema = public and table = nsa
    INFO:  UNLOAD completed, 0 record(s) unloaded successfully.
    INFO:   Unloading of the DB [stg] is success !!!
    CALL
{% endhighlight %}

* From the `unload_history` table you can get the COPY query to load into any other RedShift cluster.
* Caution: You need to install this procedure on all the databases to work seamlessly. 

## Reference Links:

1. [Why are we unload with partitions (yyyy/mm/dd) in S3]()
2. [Unload all the tables to S3.](https://thedataguy.in/redshift-unload-all-tables-to-s3/)
3. [Use comma separated string in RedShift stored procedure argument.](https://thedataguy.in/redshift-stored-procedure-comma-separated-string-in-argument/)