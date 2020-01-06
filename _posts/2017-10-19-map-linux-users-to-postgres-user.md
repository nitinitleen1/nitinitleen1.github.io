---
layout: post
title: How To Map Linux Users To Postgres User
date: 2017-10-19 16:19:05.000000000 +00:00
description: If anyone wants to map your linux users to postgres then this is for you. We have mapped root user with Postgres user.
categories:
- PostgreSQL
tags:
- linux
- postgresql
- security

---

![linux users to postgres]({{ site.baseurl }}/assets/How-to-map-Linux-users-to-PostgreSQL-user.jpeg "linux user to postgres")

Map root user to Postgres user

I had a chance to map Linux users to Postgres. Recently I have started to understand the PostgreSQL's internal processing. One of the topics explained about the pg_ident.conf file. Till that time I never used that file, even I didn't hear about that. Basically, this file will help you to connect with PostgreSQL from any System users. I have configured everything to connect PostgreSQL from root user, but still, couldn't able to connect. Because I used psql command to connect.

{% highlight shell %}
root@sqladmin#psql psql
FATAL: role "root" does not exist
{% endhighlight %}

I have wasted 2 days for this. Then I found one solution in StackOverflow that I should mention the PostgreSQL username in the command. Here is the configurations to map any Linux users to PostgreSQL.

In this blog, I have mapped my root user.
Edit the ***pg_ident.conf*** file and add the below line.

{% highlight shell %}
# MAPNAME SYSTEM-USERNAME PG-USERNAME
mapping_root root postgres
{% endhighlight %}

** MAPNAME**: A friendly name for your mapping.
**SYSTEM-USERNAME:** Name of the system user that wants to map.
**PG-USERNAME:** Name of the PostgreSQL user that the Linux user should connect.
Edit the *pg_hba.conf* file to enable this mapping

{% highlight shell %}
# TYPE DATABASE USER ADDRESS METHOD
local all postgres peer
# -- add mapping configs.
local all postgres peer map=mapping_root
{% endhighlight %}

Restart your PostgreSQL or Reload it.
Now you should enter the below command to connect PostgreSQL via root user

{% highlight shell %}
root@sqladmin#psql
{% endhighlight %}

I have tested this on PostgreSQL 9.6.