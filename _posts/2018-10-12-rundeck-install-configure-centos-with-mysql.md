---
layout: post
title: RunDeck Series 1 - Install And Configure RunDeck 3.0 On CentOS 7
date: 2018-10-12 08:07:29.000000000 +00:00
description: This blog will help to install and configure rundeck 3.0 on the centos 7 with mysql database, change default rundeck password and etc.

categories:
- Rundeck
tags:
- automation
- centos
- mysql
- rundeck
- rundeck series

---
![Install And Configure RunDeck 3.0 On CentOS 7]({{ site.baseurl }}/assets/Rundeck-Series-Install-And-Configure-RunDeck-3.0-On-CentOS-7.png)  

> I have done many automations MySQL Automations with Rundeck. This blog series will explain about the DevOps In MySQL with Rundeck.

Rundeck is one of my favourite Automation tools. Here we are going to see how can we install and configure rundek on a CentOS server with mysql as a backend. Even I like Jenkins, but as a SYSadmin, I like the Rundeck a lot.You may think like both can do automation. But as per my understanding is,

*   Jenkins - is for Development and CI/CD purpose.
*   Rundeck - Operation related automations

Im using Rundeck to automate my day to day DBA jobs. The recent version of Rundeck has few major changes in adding nodes and some other places. In this blog, I have mentioned the steps to configure Rundeck with MySQL as a Backend.

## Pre-Requirements:

*   A Server(or VM) with CentOS 7
*   MySQL 5.7 or 8.0 (5.6 is old)
*   Java 8

## Installation Steps:

{% highlight shell %}
#install Java
yum install java-1.8.0

#install rundeck repo
rpm -Uvh https://repo.rundeck.org/latest.rpm

#install rundeck latest version
yum install rundeck

#start rundeck service
service rundeckd start
{% endhighlight %}


To verify the rundeck status run the below command.

{% highlight shell %}
service rundeckd status

# OUTPUT
● rundeckd.service - SYSV: rundeckd, providing rundeckd
   Loaded: loaded (/etc/rc.d/init.d/rundeckd; bad; vendor preset: disabled)
   Active: active (running) since Tue 2018-10-09 09:06:55 +0530; 3 days ago
     Docs: man:systemd-sysv-generator(8)
 Main PID: 3617 (runuser)
   CGroup: /system.slice/rundeckd.service
           ‣ 3617 runuser -s /bin/bash -l rundeck -c java -Drundeck.jaaslogin=true            -Djava.security.auth.login.config=/etc/rundeck/jaas-loginmodule.conf            -Dlogin...

Oct 09 09:06:55 prod-mgnt-rundeck-01 systemd[1]: Unit rundeckd.service entered failed state.
Oct 09 09:06:55 prod-mgnt-rundeck-01 systemd[1]: rundeckd.service failed.
Oct 09 09:06:55 prod-mgnt-rundeck-01 systemd[1]: Starting SYSV: rundeckd, providing rundeckd...
Oct 09 09:06:55 prod-mgnt-rundeck-01 rundeckd[3607]: Starting rundeckd: [  OK  ]
Oct 09 09:06:55 prod-mgnt-rundeck-01 systemd[1]: Started SYSV: rundeckd, providing rundeckd.
{% endhighlight %}


## Accessing Rundeck:

Before accessing rundeck through browser, You need do the below changed in the config file.

{% highlight shell %}
vi /etc/rundeck/framework.properties 

framework.server.name = PUBLIC_IP_OF_THE_SERVER
framework.server.hostname = PUBLIC_IP_OF_THE_SERVER
framework.server.port = 4440
framework.server.url = http://PUBLIC_IP_OF_THE_SERVER4440

# Restart rundeck
service rundeckd restart
{% endhighlight %}


If you want to access the Rundeck privately (through VPN), Use private IP to the configuration. You can also assign some CNAME URL for this. 

Open any browser and type the URL as **_IP_address:4440_**

## Change Default Password:

Rundeck using the default username as admin and its password as admin. To change this edit the realm.properties file and restart rundeck.

{% highlight shell %}
vi /etc/rundeck/realm.properties

# This sets the default user accounts for the Rundeck app
admin:admin,user,admin,architect,deploy,build

to 
admin:NEW_PASSWORD,user,admin,architect,deploy,build

# Save it and restart
service rundeckd restart
{% endhighlight %}


To learn more about authentication and adding new users, [click here.](https://rundeck.org/docs/administration/security/authenticating-users.html)

## Add MySQL as a Backend:

By default, rundeck is using some DB file for storing the jobs and other information. But its not a better database for a Production environment. Rundeck supports MySQL and PostgreSQL as backends.

### Install MySQL Repository

{% highlight shell %}
rpm -ivh https://dev.mysql.com/get/mysql80-community-release-el7-1.noarch.rpm
{% endhighlight %}

### Enable MySQL 5.7 Repo

This repository will enable 8.0 as default installation. So we need to disable all versions and enable only on 5.7

{% highlight shell %}
vi /etc/yum.repos.d/mysql-community.repo

[mysql57-community]
name=MySQL 5.7 Community Server
baseurl=http://repo.mysql.com/yum/mysql-5.7-community/el/6/$basearch/
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-mysql

#Disable other versions
[mysql80-community]
...
...
enabled=0 ...
{% endhighlight %}

### Install MySQL 5.7
{% highlight shell %}

    yum install mysql-server
{% endhighlight %}

### Create a Database and an User for Rundeck:

Login to mysql and run the below commands.

{% highlight sql %}
mysql -u root -p
Enter Password:

create database rundeck;
grant ALL on rundeck.* to 'rundeckuser'@'localhost' identified by 'your-password';
flush privileges;
{% endhighlight %}


## Set Rundeck to use MySQL:

{% highlight shell %}
vi /etc/rundeck/rundeck-config.properties

dataSource.url = jdbc:mysql://localhost/rundeck?autoReconnect=true
dataSource.username=rundeckuser
dataSource.password=your-password
dataSource.driverClassName=com.mysql.jdbc.Driver

# Restart rundeck
service rundeckd restart
{% endhighlight %}