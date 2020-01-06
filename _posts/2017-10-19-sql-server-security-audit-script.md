---
layout: post
title: SQL Server All In One Security Audit Script
date: 2017-10-19 16:31:19.000000000 +00:00
description: This audit script will provide you the security loops holes like week passwords, sql service startup type, service account for sql server and etc.
categories:
- SQLserver
tags:
- security
- sqlserver
- tsql

---

![All In One Security Audit Script]({{ site.baseurl }}/assets/SQL-Server-All-In-One-Security-Audit-Script.jpeg)


As a DBA, Secure my SQL server is a pretty important part. Generally Security in the sense most of us point to users and their weak passwords. But apart from user accounts, there are some critical parts are also there.

Instead of googling it and execute all the queries which are found in many blogs and combine all the reports together is not a feasible way, So I have been taken a list of security checklist and prepared a Tsql script to check all the loopholes in the SQL Server.

### Check List:

-   **SQL Server's service account: **
    All SQL server services must be running under an AD account, if it is a workgroup server then it should be an Administrator account.
-   **Default Directories**:
    While installing SQL Server it could ask the default directors for Data, Log and Backup. We should not keep this in *C:\*
-   **Services Startup:**
    SQL services are able to start when the Windows server is started.
-   **SA Account:**
    If you don't want the SA account then go ahead and disabled it. If you need then rename and make a strong password.
    For disabling SA you can use the below stored procedure.
    *exec sp_SetAutoSAPasswordAndDisable*
-   **Password: **
    Don't use username and password are same, and never leave it as blank.
-   **Sysadmin User:**
    Don't give sysadmin role to anyone other than DBAs.
-   **SQL Port:**
    Its a recommend one to use non default port for SQL server.
-   **Number of databases:**
    This is not that much affect the SQL servers security, but use less then 100 databases for a medium size server.
-   **Buildin\Administrator:**
    In SQL server BUILDIN\Administrator login is enabled then go and immediately disable it. Because who all are have administrator privilege in windows server, those users can directly access the SQL server.
-   **Database Level Access:**
    limit the *db_owner* and *db_writter* access.

**Download the Script:** [Get it from my Git repo](https://github.com/SqlAdmin/tsqltools/blob/master/Security%20Audit/tsqltools_AllInOneSecurityAudit.sql)

### Results:
Server Level Audit

![All In One Security Audit Script1]({{ site.baseurl }}/assets/All-In-One-Security-Audit-Script1.png)

Database level Audit

![All In One Security Audit Script]({{ site.baseurl }}/assets/All-In-One-Security-Audit-Script2.png)

