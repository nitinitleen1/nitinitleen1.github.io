---
layout: post
title: How To Migrate PostgreSQL Users To AWS RDS PostgreSQL
date: 2018-03-06 06:51:18.000000000 +00:00
description: This post will explain how to Migrate PostgreSQL users from on-prem or EC2 PostgreSQL to RDS. We can't grant superuser in RDS instead we can use rds_superuser.
categories:
- PostgreSQL
tags:
- aws
- migration
- postgresql
- rds

---
How To Migrate PostgreSQL Users To AWS RDS PostgreSQL]({{ site.baseurl }}/assets/How-To-Migrate-PostgreSQL-Users-To-AWS-RDS-PostgreSQL.jpg)

According to PostgreSQL migration, we can migrate the databases and tables. I was migrating a Postgresql environment from EC2 to RDS Postgresql. I have completed the data migration. In many blogs, they have mentioned the steps to migrate PostgreSQL users to another server. But in RDS I couldn't able to do that. I got the below error.

{% highlight shell %}
**ERROR**: must be superuser to alter superusers
{% endhighlight %}

It seems we can't directly import the users because few users had superuser role. So we need to do some sanitization to migrate the users.

### The roles that are not supported in RDS:

-   SuperUser
-   Replication

So we need to remove these roles in the import file. Here are the complete steps for migrating PostgreSQL user to RDS.

### Dump out the users:
{% highlight shell %}
pg_dumpall -g > users.sql
{% endhighlight %}

### Directly Import to another PostgreSQL servers(Ec2/On-Prem):
{% highlight shell %}
awk '/CREATE/' users.sql > migrate.sql
psql -h another-server -d postgres -U adminuser < migrate.sql
{% endhighlight %}

### Importing to AWS RDS PostgreSQL:
{% highlight shell %}
awk '/CREATE/' users.sql > migrate.sql
-- Sanitize superuser, replication roles
sed -i -e's/NOSUPERUSER//g; s/SUPERUSER//g; s/NOREPLICATION//g; s/REPLICATION//g' migrate.sql

-- Import superusers from current servers and grant rds_superuser privilege.
psql -h localserver -d postgres -t -c"select 'grant rds_superuser to '||rolname ||';' from pg_roles where rolsuper='t';" -P "footer=off" >> migrate.sql
{% endhighlight %}

{% highlight shell %}
psql -h rds-endpoint -U adminuser -d postgres < migrate.sql
{% endhighlight %}

![How To Migrate PostgreSQL Users To AWS RDS PostgreSQL_result.png]({{ site.baseurl }}/assets/How-To-Migrate-PostgreSQL-Users-To-AWS-RDS-PostgreSQL_result.png)