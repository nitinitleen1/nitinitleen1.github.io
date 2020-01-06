---
layout: post
title: RunDeck Series 4 - Configure RunDeck SMTP With AWS SES
date: 2018-12-29 07:14:00.000000000 +00:00
description: Any automations notification system is very important. Rundeck provides multiple integrations.We can configure rundeck SMTP with AWS SES.

categories:
- Rundeck
tags:
- aws
- rundeck
- rundeck series
- ses

---
![Configure RunDeck SMTP With AWS SES]({{ site.baseurl }}/assets/Configure-RunDeck-SMTP-With-AWS-SES-1024x285.jpg)

For any automations notification system is very important. Rundeck provides multiple integrations for job notifications. But SMTP is main for many users. In this blog, we are going to configure RunDeck SMTP with AWS SES.

**Tip:**[Configure Nginx ProxyPass For RunDeck](https://www.sqlgossip.com/configure-nginx-proxypass-for-rundeck/)

AWS SES:
--------

AWS SES is a managed SMTP service.

Go to your AWS Console --> SES.
SES available on three regions.

-   US East (N. Virginia)
-   US West (Oregon)
-   EU (Ireland)

You can select which is nearest to you or low cost.

Add Sender Email in SES:
------------------------

In the SES console, Go to Email address and verify your sender email address. SES uses this email for sending emails.

![Configure RunDeck SMTP With AWS SES]({{ site.baseurl }}/assets/Configure-RunDeck-SMTP-With-AWS-SES1.jpg)

Create SMTP Credentials:
------------------------

Go to SMTP Settings --> Create My SMTP Credentials.
Provide an user name for SES, then click create. I'll generate an AccessKey and SecretKey.

-   Access Key -- Username
-   Secret Key -- Password

![Configure RunDeck SMTP With AWS SES]({{ site.baseurl }}/assets/Configure-RunDeck-SMTP-With-AWS-SES2.jpg)

![Configure RunDeck SMTP With AWS SES2]({{ site.baseurl }}/assets/Configure-RunDeck-SMTP-With-AWS-SES3.jpg)

SMTP Server Details:
--------------------

In SMTP Settings you can get your SMTP server details.

![Configure RunDeck SMTP With AWS SES]({{ site.baseurl }}/assets/Configure-RunDeck-SMTP-With-AWS-SES6-1024x202.jpg)

NOTE: Im using Virginia, so please make sure your SMTP endpoint with your region {: .notice}

![Configure RunDeck SMTP With AWS SES5]({{ site.baseurl }}/assets/Configure-RunDeck-SMTP-With-AWS-SES5-1024x186.jpg)

Add SMTP Details to RunDeck:
----------------------------

Add the below lines to **rundeck-config.properties** file.


{% highlight html linenos %} {% raw %}vi /etc/rundeck/rundeck-config.properties
#SMTP Details
grails.mail.host=email-smtp.us-east-1.amazonaws.com 
grails.mail.port=587 
grails.mail.username=XXXXXXXXXXXXXXX #your access key 
grails.mail.password=XXXXXXXXXXXXXXX #your secret key 
grails.mail.default.from=bhuvi@thedataguy.in #your ses verified sender email

service rundeckd restart{% endraw %} {% endhighlight %}