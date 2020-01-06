---
title: MySQL Convert Binlog Based Replication To GTID Replication Without Downtime
date: 2019-08-24 13:28:00 +0530
description: 'MySQL using binlog file and position for replication. For setting up
  GTID based replication we need to use master_auto_position is 1. '
categories:
- mysql
tags:
- mysql
- replication
- gtid
image: "/assets/MySQL Convert Binlog Based Replication To GTID Replication Without
  Downtime-cover.png"

---
This title may be suitable for the new age MySQL Users. Because in 5.7 onwards its already supported to enable GTID online. But still few of my mission critical databases are in 5.6 and handling `70k QPS`. So I know enabling GTID needs downtime for this. But in my case, the GTID has been already implemented. But still the replication is using Binlog file name and position for replicating the data. 

This is my slave status. You can see the GTID has been enabled but the `Auto_Position` is still 0 which means still my replication is binlog filename and position. No issues with the replication. But the MySQL world already moved to GTID for better control on replication and Failover. 

                 Master_Server_Id: 10010
                      Master_UUID: c924545b-a3e3-11e8-8a39-42010a280410
                 Master_Info_File: mysql.slave_master_info
                        SQL_Delay: 0
              SQL_Remaining_Delay: NULL
          Slave_SQL_Running_State: 
               Master_Retry_Count: 86400
                      Master_Bind: 
          Last_IO_Error_Timestamp: 
         Last_SQL_Error_Timestamp: 
                   Master_SSL_Crl: 
               Master_SSL_Crlpath: 
               Retrieved_Gtid_Set: c924545b-a3e3-11e8-8a39-42010a280410:1021245412-5365162807
                Executed_Gtid_Set: c924545b-a3e3-11e8-8a39-42010a280410:4975917719-5053294256:5053294258-5365162769
                    Auto_Position: 0

Im using MySQL Orchestrator for Failover. And we need to use either `MySQL GTID` for `pesudo GTID` for failover. I did googling for how can I change this auto position to 1 without breaking the replication. Initially I thought just get the last executed the GTID set from the slave status and purge it. Then change the auto position to 1. But it was a bad idea. 

### WHY? 

I stopped the slave thread and got this last executed GTID from the slave status.

    c924545b-a3e3-11e8-8a39-42010a280410:3501467-3659834

Then I ran,

    set global gtid_purged='c924545b-a3e3-11e8-8a39-42010a280410:3501467-3659834'; 

So what happened here is, it only purges ID 3501467 and 3659834.  Then if I start the slave thread, it'll get the below error message.

    Got fatal error 1236 from master when reading data from binary log:  'The slave is connecting using CHANGE MASTER TO MASTER_AUTO_POSITION = 1, but the  master has purged binary logs containing GTIDs that the slave requires.'

MySQL tried to ignore the IDs But we want to purge all the Is till 3659834. Its not a big deal who all are familiar with GTID. It just a logical way thinking :) 

Just try to purge the GTID set beginning from 1. Follow these steps to convert binlog position based to auto position.

> **DISCLAIMER**: This command invokes `RESET MASTER`. If you have any application or the slave is acting as a master for another slave(Cascading replication), then you will be fired from your organization. So make sure this is only a slave role and its binlog is not used for any streaming or other replication process. 

    mysql> stop slave;
    Query OK, 0 rows affected (0.05 sec)

Get the binlog filename, position, GTID. So if something goes wrong we can resume the replication with binlog file name and position.

    mysql> show slave status\G;
                Master_Log_File: mysql-bin.012187
              Read_Master_Log_Pos: 450020919
                   Relay_Log_File: mysqld-relay-bin.007983
                    Relay_Log_Pos: 450002463
            Relay_Master_Log_File: mysql-bin.012187
                 Slave_IO_Running: No
                Slave_SQL_Running: No
              Exec_Master_Log_Pos: 450002253
                  Relay_Log_Space: 450021421
               Retrieved_Gtid_Set: c924545b-a3e3-11e8-8a39-42010a280410:1021245412-5365162807
                Executed_Gtid_Set: c924545b-a3e3-11e8-8a39-42010a280410:4975917719-5053294256:5053294258-5365162769
                    Auto_Position: 0

Reset the master and enable the GTID.

    mysql> SHOW GLOBAL VARIABLES LIKE 'gtid%';
    +---------------+----------------------------------------------------------------------------------+
    | Variable_name | Value                                                                            |
    +---------------+----------------------------------------------------------------------------------+
    | gtid_executed | c924545b-a3e3-11e8-8a39-42010a280410:4975917719-5053294256:5053294258-5365162769 |
    | gtid_mode     | ON                                                                               |
    | gtid_owned    |                                                                                  |
    | gtid_purged   |                                                                                  |
    +---------------+----------------------------------------------------------------------------------+
    4 rows in set (0.00 sec)
    
    mysql> reset master;
    Query OK, 0 rows affected (17.23 sec)
    
    mysql> set global gtid_purged='c924545b-a3e3-11e8-8a39-42010a280410:4975917719-5053294256:1-5365162769';
    Query OK, 0 rows affected (0.06 sec)
    
    mysql> change master to master_auto_position=1;
    Query OK, 0 rows affected (0.15 sec)
    
    mysql> start slave;
    Query OK, 0 rows affected (0.00 sec)
    
    mysql> show slave status\G
    Executed_Gtid_Set: c924545b-a3e3-11e8-8a39-42010a280410:1-5365162769
    Auto_Position: 1