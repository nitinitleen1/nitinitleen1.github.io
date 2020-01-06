---
layout: post
title: Postgresql Insecure directory in ENV PATH - Unable To Start
date: 2017-12-05 12:42:07.000000000 +00:00
description: Unable to start postgresql in ubuntu. The error in postgrsql Insecure directory in env path. In syslog Insecure directory in $ENV{PATH}.
categories:
- PostgreSQL
tags:
- linux
- postgresql
- ubuntu

---

![Postgrsql Insecure directory in env path]({{ site.baseurl }}/assets/Postgresql-Unable-To-Start-Insecure-directory-in-ENV-PATH.jpg)

> Insecure directory in $ENV{PATH}

I was discussing with one of my friend who is a Developer, as he was working with PostgreSQL 9.5 in Ubuntu 16.04LTS from past few months. But suddenly he couldn't able to start PostgreSQL service. He tried to reinstall PostgreSQL many times, but no luck. So he gave his laptop to me and asked to fix this issue.(Because of Im a DBA). The very first thing I started to look at the Postgresql logs. Unfortunately, nothing was there. So I checked the syslog file and found something wrong. It was showing the error in **Postgrsql Insecure directory in env path**.

Here is the complete error log:
-------------------------------
{% highlight shell %}

Dec 5  17:21:17 k7-ThinkPad systemd[1]: Starting PostgreSQL Cluster 9.5-main...
Dec 5  17:21:17 k7-ThinkPad postgresql@9.5-main[5682]: Insecure directory in $ENV{PATH} while running with -T switch at /usr/bin/pg_ctlcluster line 469.
Dec 5  17:21:17 k7-ThinkPad systemd[1]: postgresql@9.5-main.service: Control process exited, code=exited status=2
Dec 5  17:21:17 k7-ThinkPad systemd[1]: Failed to start PostgreSQL Cluster 9.5-main.
Dec 5  17:21:17 k7-ThinkPad systemd[1]: postgresql@9.5-main.service: Unit entered failed state.
Dec 5  17:21:17 k7-ThinkPad systemd[1]: postgresql@9.5-main.service: Failed with result 'exit-code'.
Dec 5  17:21:17 k7-ThinkPad systemd[1]: Started PostgreSQL RDBMS.
{% endhighlight %}

From these errors, we can guess something wrong with the /usr/bin/pg_ctlcluster file and the line 469.

Here is the line:
-----------------
{% highlight shell %}

466  # recreate stats_temp_directory
467  if  ($action ne 'stop' && $info{config}->{stats_temp_directory} && ! -d $info{config}->{stats_temp_directory})  {
468 system 'install', '-d', '-m', 750,
469  '-o', $info{'owneruid'}, '-g', $info{'ownergid'}, $info{config}->{stats_temp_directory};
470  }
{% endhighlight %}

Seems its fine. Then what caused this issue?\
Look at the line number 468.
{% highlight shell %}

system 'install', '-d', '-m', 750,
{% endhighlight %}

The 750 is nothing its the permission for the ENV PATH.

Here is the ENV PATH in this file.
----------------------------------
{% highlight shell %}

# untaint environment
$ENV{'PATH'} = '/sbin:/bin:/usr/sbin:/usr/bin';
delete @ENV{'IFS', 'CDPATH', 'ENV', 'BASH_ENV'};
chdir '/';
{% endhighlight %}

Solution:
---------

Change the permission for the **/bin** directory.
{% highlight shell %}

chmod 750 /bin
service postgresql start
su postgres
psql
{% endhighlight %}

![Postgrsql Insecure directory in env path - Result]({{ site.baseurl }}/assets/Postgrsql-Insecure-directory-in-env-path-Result.png)