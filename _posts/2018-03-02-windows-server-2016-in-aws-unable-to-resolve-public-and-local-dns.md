---
layout: post
title: Why Windows Server 2016 In AWS Unable To Resolve Public And Local DNS
date: 2018-03-02 17:58:24.000000000 +00:00
description: Windows Domain Controller 2016 in AWS is unable to resolve both public and private DNS. On windows server 2012 its working fine. To fix this issue add DNS suffix and add AWS VPC DNS IP in DNS forwarders.

categories:
- AWS
tags:
- active directory
- aws
- dns
- windows server

---

![Windows Server 2016 In AWS Unable To Resolve Public And Local DNS]({{ site.baseurl }}/assets/Windows-Server-2016-In-AWS-Unable-To-Resolve-Public-And-Local-DNS_Head.jpg)

Before reading further about this DNS issue, I want to clarify few things.

-   This issue happened only in AWS.
-   Windows Server 2016 has this issue.
-   On Domain Controller, I was Able to access the internet before configuring the AD/DNS.
-   On Member Server, I was able to access the internet before joining the domain.
-   Standalone Windows servers are working fine. Only the Domain Controller and the members of the domain having this problem.

I was working to setup a SQL server alwayson availability group in AWS, So I was thinking to go with Windows Server 2016.

Once I have configured the Domain Controller I have added the 2 windows server(SQL server instances) to the domain. Here are my setup details,

-   VPC Range: 172.31.0.0/16
-   Domain Name: sql.com

| Server | OS | Computer Name | IP address |
| Domain Controller | Windows Server 2016 | AD | 172.31.56.206 |
| SQL Server 1 | Windows Server 2016 | SQL1 | 172.31.53.114 |
| SQL Server 2 | Windows Server 2016 | SQL2 | 172.31.58.49 |

Then I have started to test the DNS.

Issue 1: DNS Unable to Resolve the IP address using the HostName
----------------------------------------------------------------

From AD server, I can able to ping other servers using FQDN name. But when I tried to ping the hostname alone it was not working.
{% highlight powershell %}
C:\Users\Administrator>ping sql1
Ping request could not find host sql1. Please check the name and try again.

C:\Users\Administrator>ping sql1.sql.com
Pinging sql1.sql.com [172.31.53.114] with 32 bytes of data:
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128

Ping statistics for 172.31.53.114:
Packets: Sent = 4, Received = 4, Lost = 0  (0% loss),
Approximate round trip times in milli-seconds:
Minimum = 0ms, Maximum = 0ms, Average = 0ms
{% endhighlight %}

Hmm, Something wrong, then I started to test the same thing on all the three servers. Unfortunately, there also I got the same response. But I never faced this issue when I was using Windows Server 2012 as my AD/DNS server.

Then I found the PING not checking the DNS suffix.

### Solution:

I have added the **domain name** in the DNS suffix.
{% highlight html linenos %} {% raw %}Go to Control Panel.
Network and Internet.
Network and Sharing Center.
Select your current network adapter.
Go to Properties.
Internet Protocol version 4(TCP/IPv4).
Under the DNS server properties click Advanced.
Select the DNS tab.
Add your domain name in the Append these DNS suffixes(in order).{% endraw %} {% endhighlight %}


![Windows Server 2016 In AWS Unable To Resolve Public And Local DNS]({{ site.baseurl }}/assets/Windows-Server-2016-In-AWS-Unable-To-Resolve-Public-And-Local-DNS.png)

Added Domain name in DNS suffix

### How this fixed:

DNS requires an FQDN to resolve, I don't make sense to resolve a hostname alone. While adding the DNS suffix the request will try to resolve your hostname + your DNS suffix(the domain). So if we try to ping sql1, then it'll try to resolve sql1.sql.com
{% highlight powershell %}

C:\Users\Administrator>ping sql1

Pinging sql1.sql.com [172.31.53.114] with 32 bytes of data:
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128
Reply from 172.31.53.114: bytes=32 time<1ms TTL=128

Ping statistics for 172.31.53.114:
Packets: Sent = 4, Received = 4, Lost = 0  (0% loss),
Approximate round trip times in milli-seconds:
Minimum = 0ms, Maximum = 0ms, Average = 0ms
{% endhighlight %}

Issue 2: Unable to access the internet
--------------------------------------

After configured the Domain Controller, I can't able to access the internet. Even PING google.com is also not worked on Both AD and other servers.
{% highlight powershell %}

C:\Users\Administrator>ping google.com
Ping request could not find host google.com. Please check the name and try again.
{% endhighlight %}

But I can able to ping the IP address of the Google's DNS.
{% highlight powershell %}

C:\Users\Administrator>ping 8.8.8.8

Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time<1ms TTL=51
Reply from 8.8.8.8: bytes=32 time<1ms TTL=51
Reply from 8.8.8.8: bytes=32 time<1ms TTL=51
Reply from 8.8.8.8: bytes=32 time<1ms TTL=51

Ping statistics for 8.8.8.8:
Packets: Sent = 4, Received = 4, Lost = 0  (0% loss),
Approximate round trip times in milli-seconds:
Minimum = 0ms, Maximum = 0ms, Average = 0ms
{% endhighlight %}

The Member servers also unable to access the internet, because it'll forward the queries to the DNS server(AD server).  But the DNS server is also unable to resolve the name.

### Temporary Fix:

Added **8.8.8.8** as Secondary DNS Server. But this fixed the internet issue where I added this Secondary DNS. One more option is, I have added the Google DNS IP in the DNS's server's forwarders.

### Solution:

Here the AWS's networking is playing with us. While creating the VPC, AWS will reserve 5 IP addresses for its internal use. One of those IP is responsible for the DNS.

I have posted a question regarding this on [Reddit](https://www.reddit.com/r/sysadmin/comments/814mwx/dns_issue_windows_domain_controller_2016_unable/). Someone gave me an idea that where I can concentrate to fix this.

![Windows Server 2016 In AWS Unable To Resolve Public And Local DNS]({{ site.baseurl }}/assets/Windows-Server-2016-In-AWS-Unable-To-Resolve-Public-And-Local-DNS2.png)

Click to Enlarge

From AWS,

The first four IP addresses and the last IP address in each subnet CIDR block are not available for you to use, and cannot be assigned to an instance. For example, in a subnet with CIDR block `10.0.0.0/24`, the following five IP addresses are reserved:

-   **`10.0.0.0`**: Network address.
-   **`10.0.0.1`**: Reserved by AWS for the VPC router.
-   **`10.0.0.2`**: Reserved by AWS. The IP address of the DNS server is always the base of the VPC network range plus two; however, we also reserve the base of each subnet range plus two. For VPCs with multiple CIDR blocks, the IP address of the DNS server is located in the primary CIDR.
-   **`10.0.0.3`**: Reserved by AWS for future use.
-   **`10.0.0.255`**: Network broadcast address. We do not support broadcast in a VPC, therefore we reserve this address.

*READ*: To understand more about the [AWS VPC Networking](https://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_DHCP_Options.html#AmazonDNS)

For my VPC 172.31.0.2 is taking care of the DNS queries. So I have added it to the DNS forwarders.

1.  Open DNS.
2.  Right click the DNS server.
3.  Go to Properties.
4.  Select Forwarders and Click Edit.
5.  Type 172.31.0.2 (You can add your DNS, based on the VPC range).
6.  Restart the AD/DNS server.

![Windows Server 2016 In AWS Unable To Resolve Public And Local DNS]({{ site.baseurl }}/assets/Windows-Server-2016-In-AWS-Unable-To-Resolve-Public-And-Local-DNS1.png)]

Added the AWS DNS in the DNS server's forwarders

Why didn't I face this issue on Windows Server 2012?
----------------------------------------------------

To Debug this issue, I have launched an AD server with Windows 2012 Base. Then configured ADDS and DNS. After that, I have checked the DNS Forwarders in the DNS and checked the DNS suffix in the IP properties. The domain name is already added in the DNS suffix. Also, AWS DNS Forwarders(172.31.0.2) is also added in DNS Forwarders.

So Finally I have found this is happening in AWS server. ***I don't know whether its a Bug in AWS, or I only faced this issue with Windows Server 2016.***