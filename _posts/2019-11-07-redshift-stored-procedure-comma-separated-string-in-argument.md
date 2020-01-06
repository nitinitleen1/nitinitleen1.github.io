---
title: Redshift Stored Procedure Comma separated string in Argument
date: 2019-11-07 14:30:00 +0530
description: 'In this blog we experimented in redshift stored procedure to use multiple
  comma separated values as an augment/parameter and pass it into where clause. '
categories:
- AWS
tags:
- aws
- " redshift"
- sql
image: "/assets/Redshift Stored Procedure Comma separated string in Argument.jpg"

---
RedShift stored procedures are really useful feature and after a long time they introduced it. I tried this stored procedure for many use cases and recently I came up with a complexity in it. You can't get a comma separated sting in the argument. Lets say I have an employee table and I want to pass the employee names in a variable/argument and you need to `select * from table where employee_name in ('your comma separated values)`. It'll not work directly.

Why? many SQL peoples already know the reason. Because you have multiple values in one string and you need to parse it as multiple quotes string and pass it.

**Example:**

Input: `'emp1, emp2, emp3'`

In SQL you can't use IN clause like this. You need to split each and every value with single quote. Then it should be

`'emp1', 'emp2', 'emp3'`

In `plpgsql`, you can do this parsing with some temp table snd SQL queries. I have asked the steps in [DBA's stackoverflow](https://dba.stackexchange.com/questions/250323/plpgsql-stored-procedure-comma-separated-values-in-parameters) and [**a horse with no name**](https://dba.stackexchange.com/questions/250323/plpgsql-stored-procedure-comma-separated-values-in-parameters) (yeah, its a weird name) answered it. 

But in Redshift it did't work as expected. 

## What's wrong in Redshift:

 Before checking why its not working, we'll see how are we thinking to parsing it. 

1. Pass the argument into a variable.
2. Use trim functions to remove the single quote. 
3. Use the split function to split these values.
4. For each values put single quote in the beginning and the end.

Or as mentioned the stackoverflow answer, we can't use arrays for this. Thats why its not working and it'll throw the following error.
{% highlight shell %}
    ERROR: varchar[] is not a supported parameter type for functions or procedures
{% endhighlight %}

Then I searched many blogs and found the useful information. 

1. [Convert comma separated values as rows.](https://stackoverflow.com/questions/25112389/redshift-convert-comma-delimited-values-into-rows)
2. [Convert arrays into rows](https://www.holistics.io/blog/splitting-array-string-into-rows-in-amazon-redshift-or-mysql/)

I almost fixed the issue. But now the other problem came when I do query the `Information_schema` tables. My select query will look like below.
{% highlight sql %}
    SELECT table_schema, 
           table_name 
    FROM   information_schema.TABLES 
    WHERE  table_type = 'BASE TABLE' 
           AND table_schema NOT IN ( 'pg_catalog', 'information_schema' ) 
           AND table_name IN (SELECT tname 
                              FROM   my_parsed_variables);
{% endhighlight %}

While running this, I got the below error. 
{% highlight sql %}
    test=# call my_sp('bhuvi');
    INFO:  Table "my_tables" does not exist and will be skipped
    INFO:  Table "my_tokenized_tables" does not exist and will be skipped
    INFO:  Function "has_table_privilege(oid,text)" not supported.
    INFO:  Function "has_table_privilege(oid,text)" not supported.
    INFO:  Function "has_table_privilege(oid,text)" not supported.
    INFO:  Function "has_table_privilege(oid,text)" not supported.
    INFO:  Function "has_table_privilege(oid,text)" not supported.
    INFO:  Function "has_table_privilege(oid,text)" not supported.
    INFO:  Function "has_table_privilege(oid,text)" not supported.
    ERROR:  Specified types or functions (one per INFO message) not supported on Redshift tables.
    CONTEXT:  SQL statement " SELECT table_schema, table_name FROM information_schema.TABLES WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema') AND table_name !='unload_history' AND TABLE_NAME in (select tname from my_tokenized_tables)"
{% endhighlight %}

Its saying we don't have enough permissions. So I need to reached out AWS support team to help on this one piece. Then they got help from RedShift product team to write the correct SQL query. 

## Stored Procedure with multiple values:

With my stored procedure, I want to get the list of table names from the argument and print its name along with schema. 
{% highlight sql %}
    DROP PROCEDURE multi_comma_values(varchar);
    
    CREATE OR REPLACE PROCEDURE multi_comma_values(tbl_list IN varchar(400))
    LANGUAGE plpgsql
    AS $$
    DECLARE
        rec RECORD;
    BEGIN
        DROP TABLE IF EXISTS my_tables;
        DROP TABLE IF EXISTS my_tokenized_tables;
        CREATE TEMP TABLE my_tables (comma_table_names varchar(400));
        EXECUTE 'INSERT INTO my_tables VALUES (' || quote_literal(tbl_list) || ')';
    
        with NS AS (
          select 1 as n union all
          select 2 union all
          select 3 union all
          select 4 union all
          select 5 union all
          select 6 union all
          select 7 union all
          select 8 union all
          select 9 union all
          select 10
        )
        SELECT     Trim(Split_part(b.comma_table_names, ',', ns.n)) AS tname 
        INTO       temp table my_tokenized_tables 
        FROM       ns 
        inner join my_tables b 
        ON         ns.n <= regexp_count(b.comma_table_names, ',') + 1;
    
        FOR rec IN 
        SELECT nspname :: text AS namespace, 
           relname :: text AS tablename 
        FROM   pg_class pc 
           join pg_namespace pn 
             ON pc.relnamespace = pn.oid 
        WHERE  Trim(relname :: text) IN (SELECT tname 
                                     FROM   my_tokenized_tables) 
           AND Trim(nspname :: text) NOT IN ( 'pg_catalog', 'information_schema' ) 
        
        LOOP
            raise info 'schema = %, table = %', rec.namespace, rec.tablename;
        END LOOP;
        DROP TABLE IF EXISTS my_tables;
        DROP TABLE IF EXISTS my_tokenized_tables;
    END;
    $$;
{% endhighlight %}

## Call the procedure:
{% highlight sql %}
    test=# call multi_comma_values ('bhuvi,test');
    INFO:  Table "my_tables" does not exist and will be skipped
    INFO:  Table "my_tokenized_tables" does not exist and will be skipped
    INFO:  schema = public, table = test
    INFO:  schema = public, table = bhuvi
    CALL
{% endhighlight %}

## Another Scanrio:
I have a test table called `bhuvi` and I have 3 rows in it.

{% highlight sql %}
CREATE TABLE bhuvi 
  ( 
     name VARCHAR(10) 
  ); 

INSERT INTO bhuvi 
VALUES      ('a'); 

INSERT INTO bhuvi 
VALUES      ('b'); 

INSERT INTO bhuvi 
VALUES      ('c'); 
{% endhighlight %}

Now I want to run a select query where name in `b and c`. So in the above stored procure, I just edited the below FOR LOOP part.

{% highlight sql %}
FOR rec IN 
         SELECT name
        FROM   bhuvi
        WHERE  name IN (SELECT tname 
                                     FROM   my_tokenized_tables) 
        
        LOOP
            raise info 'value is = %',rec.name;
        END LOOP;
{% endhighlight %}

**Call the Procedure**
{% highlight sql %}
test=# call multi_comma_values ('b,c');
INFO:  Table "my_tables" does not exist and will be skipped
INFO:  Table "my_tokenized_tables" does not exist and will be skipped
INFO:  value is = b
INFO:  value is = c
CALL
{% endhighlight %}


## More Customization: 

* If you would to have a permanent table, then create it in your database and remove the `With NS as`
* This will only extract upto 256 I guess, if you inputing more than 10 then refer [this](https://www.holistics.io/blog/splitting-array-string-into-rows-in-amazon-redshift-or-mysql/).