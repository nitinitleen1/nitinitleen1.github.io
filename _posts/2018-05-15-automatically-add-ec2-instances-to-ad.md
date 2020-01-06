---
layout: post
title: Automatically Add EC2 Instances to Active Directory Domain
date: 2018-05-15 12:54:42.000000000 +00:00
description: This blog post will help you to Automatically Add EC2 Instances to Active Directory Domain whether it is launched by on demand purpose or auto scaling group.
categories:
- AWS
tags:
- active directory
- automation
- autoscaling
- aws
- powershell
- scripting
- windows server
---
Windows Servers are in AWS will show some glitches in sometimes.[ My previous article](http://www.sqlgossip.com/windows-server-2016-in-aws-unable-to-resolve-public-and-local-dns/)explains how Windows Server 2016 had some issues with DNS Suffix and Forwarders. This time I got a chance to play around with PowerShell automations. The requirement is automatically add EC2 instances to Active directory domain during the instance launch. It might be an On Demand purpose ec2 or launched by an Auto scaling group.

Wait, you may think like there are many blog posts available in AWS, then what else I wrote. The reason for this blog post is all of the AWS Blogs were using Cloudformation templates and SSM Agents to Automate this. In one post AWS Directory Service is also used. But here we aren't gonna use any additional AWS Services except S3.


![Automatically Add EC2 Instances to Active Directory Domain]({{ site.baseurl }}/assets/Automatically-Add-EC2-Instances-to-Active-Directory-Domain-Arc.jpg)

> Before starting the process, The same steps are already well written by [Ryan Lawyer](http://thesysadminswatercooler.blogspot.in/2015/09/aws-autoscale-windows-server-and-join.html) who is an AWS sysadmin. But he didn't mention that to add a DNS IP for the Windows Servers. Without DNS the instance will not communicate to the Domain.

The challenge while adding the DNS:
-----------------------------------

By using the below Powershell command we can add the Primary and Secondary DNS IP for windows servers.

{% highlight powershell %}
Set-DNSClientServerAddress -interfaceAlias Ethernet -ServerAddresses  ("X.X.X.X")
or
Set-DNSClientServerAddress -interfaceIndex 12 -ServerAddresses  ("X.X.X.X")
{% endhighlight %}


Here the interfaceAlias is Ethernet and interfaceIndex 12, but its not same for all the instances. interfaceIndex will be varying for each instance even if those all are same instance type. But interfaceAlias will be varying based on the instance type.

### For eg:

| Instance Type | Interface Alias Name |
| t2.medium | Ehternet 2 |
| t2.large | Ehternet |

So its not possible to hardcode the InterfaceIndex or InterfaceAlias in the powerhsell script to add the DNS IP.

Solution:
---------

To mitigate this, I have extracted the actual Alias name from the NetAdapter cmdlet function,

{% highlight powershell %}
Get-NetAdapter | where {$_.ifDesc -notlike "TAP*"} | foreach InterfaceAlias | select -First 1
{% endhighlight %}

This will give us the exact alias name. If we have more than one ENI, then it'll pick the first one.

Lets start implementing the solution.

Pre-Requirements:
-----------------

-   Launch an EC2 instance and configure Active Directory Domain Services.
-   Create an EC2 IAM role that will pick the add-domain.exe file from S3 bucket.
-   [PS2EXE](https://gallery.technet.microsoft.com/scriptcenter/PS2EXE-Convert-PowerShell-9e4e07f1) converter. (Powershell version must be <= 4.0)

### AD Server Details:

-   Domain Name: sqladmin.bhuvi
-   Domain Admin: Administrator
-   Domain Admin Password: mypassword
-   IP Address: 10.10.10.11

Create the Powerhsell script:
-----------------------------

Create a new powershell script and save it as add-ad.pd1

I have saved this file on C:\add-ad.ps1
{% highlight powershell %}

#Retrieve the AWS instance ID, keep trying until the metadata is available
$instanceID = "null"
while  ($instanceID -NotLike "i-*")  {
Start-Sleep -s 3
$instanceID = invoke-restmethod -uri http://169.254.169.254/latest/meta-data/instance-id
}

#Pass Domain Creds
$username = "sqladmin\Administrator"
$password = "mypassword" | ConvertTo-SecureString -AsPlainText -Force
$cred = New-Object -typename System.Management.Automation.PSCredential($username, $password)

#Adding to domain
Try {
Add-Computer -DomainName sqladmin.bhuvi -Credential $cred -Force -Restart -erroraction 'stop'
}

#Get Error messages in a file
Catch{
echo $_.Exception | Out-File c:\temp\error-joindomain.txt -Append
}
{% endhighlight %}


Convert PS file to EXE:
-----------------------

Now Extract the PS2EXE software. I have extracted it on C:\PS2EXE-v0.5.0.0.

Open PowerhShell windows and switch to C:\PS2EXE-v0.5.0.0 and execute the below command.
{% highlight powershell %}
cd C:\PS2EXE-v0.5.0.0
.\ps2exe.ps1 -InputFile C:\add-ps1 C:\add-ad.exe
{% endhighlight %}

Upload the EXE file to S3:
--------------------------

Now we need to upload this exe file to a S3 Bucket. You can do this by Console or API or CLI.

I have uploaded this to **`S3://mybucket/adfile/add-ad.exe`**

Create EC2 IAM Role:
--------------------

The new instances needs to download this file using powershell, so we need to assign an IAM role while launching the instance.

1.  Go to IAM -> Roles -> Cretae Role -> Ec2
2.  RoleName: AD-Adder

Once it is created assign this in line policy.
{% highlight powershell %}
{
"Version":  "2012-10-17",
"Statement":  [{
"Effect":  "Allow",
"Action":  [
"s3:GetObject",
"s3:ListBucket"
],
"Resource":  ["arn:aws:s3:::mybucket/adfiles/*"]
}]
}
{% endhighlight %}


Launch an EC2:
--------------

Its time for testing.
Launch an EC2 instance.
Attach the Ad-Adder role to the instance.

In UserData section, copy the below code and paste it.
{% highlight powershell %}
<powershell>
Set-ExecutionPolicy unrestricted -Force
New-Item c:/temp -ItemType Directory -Force
set-location c:/temp
$Eth = Get-NetAdapter | where {$_.ifDesc -notlike "TAP*"} | foreach InterfaceAlias | select -First 1
Set-DNSClientServerAddress -interfaceAlias $Eth -ServerAddresses  ("10.10.10.11")
Start-Sleep -s 5
read-s3object -bucketname mybucket -key adfiles/add.exe -file add-ad.exe
Start-Sleep -s 5
Invoke-Item C:/temp/add-ad.exe
</powershell>
{% endhighlight %}

Then select the Storage size, Security group bla bla bla. Then click launch.

Wait for few mins and check the Computer Properties. You'll see the server is added to the domain.

![Automatically Add EC2 Instances to Active Directory Domain]({{ site.baseurl }}/assets/Automatically-Add-EC2-Instances-to-Active-Directory-Domain.jpg)

Instead of S3 you can try FTP, SFTP, Shared folders.
