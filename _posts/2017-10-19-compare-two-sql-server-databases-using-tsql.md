---
layout: post
title: Compare Two SQL Server Databases using Tsql
date: 2017-10-19 17:31:30.000000000 +00:00
description: Here is the tsql script to compare two SQL Server databases using tsql without any software. You can get more insights by using this script.
categories:
- SQLserver
tags:
- sqlserver
- tsql

---
![Compare Two SQL Server Databases using Tsql]({{ site.baseurl }}/assets/Compare-Two-SQL-Server-Databases-using-Tsql.jpeg)


I'm glad to inform that today I'm going to release my next phase of TsqlTools is [SQLCOMPARE](https://github.com/SqlAdmin/tsqltools/blob/master/SQLCompare/). I was in a point to compare two databases which are on two different servers, I have checked many websites and blogs, but unfortunately, I didn't find any useful T-SQL query for that. But there is so many good software available to compare the databases. Red-Gate is one of my favorite tool for comparison.

So I have prepared 3 Tsql scripts to compare all databases objects between two SQL servers.

### 1. Tables and Objects

1.  CHECK_CONSTRAINT
2.  DEFAULT_CONSTRAINT
3.  FOREIGN_KEY_CONSTRAINT
4.  PRIMARY_KEY_CONSTRAINT
5.  SECURITY_POLICY
6.  SEQUENCE_OBJECT
7.  SQL_INLINE_TABLE_VALUED_FUNCTION
8.  SQL_SCALAR_FUNCTION
9.  SQL_STORED_PROCEDURE
10. SQL_TABLE_VALUED_FUNCTION
11. SQL_TRIGGER
12. TYPE_TABLE
13. UNIQUE_CONSTRAINT
14. USER_TABLE
15. VIEW

![Compare Two SQL Server Databases using Tsql]({{ site.baseurl }}/assets/Compare-Two-SQL-Server-Databases-using-Tsql1.png)

### 2. Index Compare

This will compare Indices from both servers and list out missing indices on each server.

 ![Compare Two SQL Server Databases using Tsql]({{ site.baseurl }}/assets/Compare-Two-SQL-Server-Databases-using-Tsql2.png)

### 3. Row Count

This is very straightforward, Just get the row count of all database's tables from both server and show the difference.

 ![Compare Two SQL Server Databases using Tsql]({{ site.baseurl }}/assets/Compare-Two-SQL-Server-Databases-using-Tsql3.png)

### How to Run this query?

You can use a centralized Server and create LinkedServers for Source and Target DB servers,
or
Create a LinkedServer for Target server on SourceDB server, then run the query on Source DB server.

## Please click the below link to download the scripts.[DOWNLOAD](https://github.com/SqlAdmin/tsqltools/tree/master/SQLCompare)
