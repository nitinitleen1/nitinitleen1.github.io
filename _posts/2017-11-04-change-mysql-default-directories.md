---
layout: post
title: How To Change MySQL Default Data,Binlog,Error Log Directories
date: 2017-11-04 11:45:29.000000000 +00:00
description: Going to change MySQL default data,binlog, error log directories and slow log directories, then this is the please to take a look for few minutes.
categories:
- MySQL
tags:
- linux
- mysql
- ubuntu

---
![change mysql default data,binlog, error log directories]({{ site.baseurl }}/assets/mysql-change-default-directories.jpg)

MySQL Change default directories

While reading this heading everybody things like, yeah its pretty old topic, we can get many articles by googling. But you know what sometimes well known things never work for us. This time it happened for me, my bad. I have done this many times. But most of us changed the default Data Directory only. Only a few of us thinking about change MySQL default data,binlog, error log directories.

I can easily change the Data directory, But while enabling binlog, and error log I got an error.
{% highlight shell %}
mysqld: File '/mysql/binlog/mysql-bin.index' not found (Errcode: 13)
{% endhighlight %}

So this is the reason for wrote this blog.

My Server Setup:
----------------

**OS:** Ubuntu 14.04LTS 64Bit

**MySQL:** 5.5.58

Destination Directories:
------------------------

**Data:** /mysql/data

**Binlog: **/mysql/data

**ErrorLog:** /mysql/error

**SlowLog:** /mysql/sowlog

### Create the Directories:
{% highlight shell %}
mkdir -p /mysql/data
mkdir -p /mysql/binlog
mkdir -p /mysql/error
mkdir -p /mysql/sowlog
{% endhighlight %}
Set permission:
{% highlight shell %}
chown -R mysql:mysql /mysql/
chmod -R 600 /mysql
{% endhighlight %}
Sync the data from old data directory to the new directory.
{% highlight shell %}
service mysql stop
sudo rsync -av /var/lib/mysql/* /mysql/data/
{% endhighlight %}
### Edit the my.cnf file
{% highlight shell %}
[mysqld]
#Data
datadir = /mysql/data/
#Binlog
log_bin = /mysql/binlog/mysql_bin
#Errorlog
log_error = /mysql/error/mysql_error.log
#slowlog
slow_query_log_file = /mysql/sowlog/mysql_slow.log
[mysql]
port = 3306
socket = /mysql/data/mysql.sock
{% endhighlight %}
Now its time to modify the apparmor files.
{% highlight shell %}
vi /etc/apparmor.d/usr.sbin.mysqld

#fine the below lines
/var/lib/mysql r,
/var/lib/mysql/** rwk,

#replace with
/mysql r,
/mysql/** rwk,
{% endhighlight %}
Thats it, now start mysql.
{% highlight shell %}
service mysql start
{% endhighlight %}