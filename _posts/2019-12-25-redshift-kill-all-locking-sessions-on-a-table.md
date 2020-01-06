---
title: RedShift Kill All Locking Sessions On A Table
date: 2019-12-25 23:30:00 +0000
description: Redshift kill all locking sessions on a particular table using a stored
  procedure. It'll collect all locking sessions pid and kill them in one shot.
categories:
- RedShift
tags:
- aws
- redshift
- sql
image: "/assets/RedShift Kill All Locking Sessions On A Table.png"

---
In any relational database, if you didn't close the session properly, then it'll lock your DDL queries. It's applicable to RedShift as well. A few days back I got a scenario that we have to run some DROP TABLE commands to create some lookup tables. But every time while triggering this DDL it got stuck. Then we realize there were some sessions that are still open and those sessions are causing this locking. There we 30+ sessions. I know we can fix this by properly closing the session from the application side. But in some emergency cases, we need to kill all open sessions or locking session in Redshift.

Then my DBA brain was telling me to create a stored procedure to get all the locking sessions and kill them in one shot. I never recommend running this all the time. But if you are a DBA or RedShift Admin, then you need to have these kinds of handy toolkits. 

{% highlight sql %}
CREATE OR replace PROCEDURE sp_superkill(table_name VARCHAR(100)) 
LANGUAGE plpgsql 
AS 
  $$ 
  DECLARE 
    list RECORD; 
    terminate_query      VARCHAR(50000); 
    drop_query VARCHAR(50000); 
  BEGIN 
    FOR list IN 
    SELECT a.datname, 
           c.relname, 
           a.procpid 
    FROM   pg_stat_activity a 
    join   pg_locks l 
    ON     l.pid = a.procpid 
    join   pg_class c 
    ON     c.oid = l.relation 
    WHERE  c.relname=table_name 

    LOOP 
    terminate_query:= 'select pg_terminate_backend('||list.procpid||')'; 
    RAISE info 'Killing pid [%]', list.procpid; 
    EXECUTE terminate_query; 
  END LOOP; 
  
  --drop_query:='drop table '||table_name; --Add DDL If you want
  --EXECUTE drop_query; --Add DDL If you want
END; 
$$;
{% endhighlight %}

## Testing the Procedure:

Open multiple sessions for a table and don't close them.
{% highlight shell %}
START TRANSACTIONS;
Select col1 from my_table limit 1;
{% endhighlight %}

Do open a few more sessions. Then run the stored procedure.
{% highlight shell %}
call sp_superkill('my_table');

INFO:  Killing pid [11734]
INFO:  Killing pid [11735]
INFO:  Killing pid [11738]
INFO:  Killing pid [11739]
CALL
{% endhighlight %}