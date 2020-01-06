---
layout: post
title: RunDeck Series 3 - Configure Nginx ProxyPass For RunDeck
date: 2018-12-29 06:14:59.000000000 +00:00
description: To run Runeck server on port 80 we need to configure nginx proxypass for rundeck. The web console for runeck will use proxy to run port 80.

categories:
- Rundeck
tags:
- automation
- rundeck
- rundeck series

---
![Configure ProxyPass For Rundeck]({{ site.baseurl }}/assets/Configure-ProxyPass-For-Rundeck-1024x316.jpg)

RunDeck's web GUI always run on port 4440. If we want to make it run on 80 then we need to do a custom installation. Since that'll be a long process and its not applicable for existing RunDeck servers. In this blog, we are configuring nginx proxypass for Rundeck to make RunDeck web access on port 80.

Install Nginx:
--------------
{% highlight shell %}
yum install nginx
{% endhighlight %}

Configure ProxyPass:
--------------------

Create a new config file on *`/etc/nginx/conf.d/`*

# Replace rundeck.sqlgossip.com to your domain name or IP address
{% highlight html linenos %} {% raw %}vi /etc/nginx/conf.d/rundeck.conf

server {
    listen 80;
    listen [::]:80;
    server_name rundeck.sqlgossip.com;
    access_log  /var/log/nginx/rundeck.sqlgossip.com.access.log;
     location / {
    proxy_pass http://localhost:4440;
    proxy_set_header X-Forwarded-Host $host:$server_port;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}{% endraw %} {% endhighlight %}

Change the Server URL in runeck config file:
--------------------------------------------

Edit the rundeck-config.properties file.

{% highlight shell %}

vi /etc/rundeck/rundeck-config.properties

grails.serverURL=http://rundeck.thedataguy.in:80

{% endhighlight %}

Restart RunDeck & Nginx
-----------------------
{% highlight shell %}
service nginx restart
service rundeckd restart
{% endhighlight %}

