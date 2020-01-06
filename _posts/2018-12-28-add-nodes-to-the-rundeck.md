---
layout: post
title: RunDeck Series 2 - Add Nodes to the Rundeck
date: 2018-12-28 19:57:17.000000000 +00:00
description: Add nodes to rundeck 3.0+ using resources.xml. Also we can import exsiting project nodes to another project. We have 3 ways to add nodes.
categories:
- Rundeck
tags:
- automation
- rundeck
- rundeck series

---
Add nodes to the Rundeck Server is very next step after installation. Here we are going to see adding Linux nodes to Rundeck. After Rudeck 3.0+ the resources.xml file will not create automatically. In previous versions, this file was automatically created while creating a project. We'll node nodes details in this file. But in latest versions, it's not creating automatically.


## Option#1 Creating resources.xml manually

In this approach, we'll add all the nodes in a file called resources.xml. Once you created a project follow the below steps.  
**Job Name: Test-Job**  
Add the below lines in `project.properties` file.

{% highlight shell %}
#Replace Test-Job with your job name

resources.source.1.config.file=/var/rundeck/projects/Test-Job/etc/resources.xml
resources.source.1.config.generateFileAutomatically=true
resources.source.1.config.includeServerNode=true
resources.source.1.type=file
{% endhighlight %}


### Create the resources.xml file
{% highlight html linenos %} {% raw %}cd /var/rundeck/projects/Test-Job/etc/
    touch resouces.xml
    vi resources.xml

    <?xml version="1.0" encoding="UTF-8"?>
    <project>
    <node name="mysql-master"  tags="mysql" hostname="10.0.0.1" osArch="amd64" osFamily="unix" osName="Linux" osVersion="4.9.0-2-amd64" username="rundeck"/>

    <node name="replica-01"  tags="mysql" hostname="10.0.0.2" osArch="amd64" osFamily="unix" osName="Linux" osVersion="4.9.0-2-amd64" username="rundeck"/>

    </project>
{% endraw %} {% endhighlight %}

Save this file and restart Rundeck service.

{% highlight shell %}
service rundeckd restart
{% endhighlight %}



## Option#2 Import from other projects

We need to add nodes whenever we create a new project. From the above example, we added nodes to Test-Job project. If we create one more project again we need to follow the same steps. Instead, we can export the nodes from any existing projects.  
**Project Name:** **sqladmin-jobs**  
Go to Projects --> sqladmin-jobs.  
Project Settings --> Edit Nodes --> Configure Nodes.  
Add Sources --> File.

![Add Nodes to the Rundeck]({{ site.baseurl }}/assets/Add-Nodes-to-the-Rundeck-1024x546.jpg)
![Add Nodes to the Rundeck]({{ site.baseurl }}/assets/Add-Nodes-to-the-Rundeck1.jpg)
![Add Nodes to the Rundeck]({{ site.baseurl }}/assets/Add-Nodes-to-the-Rundeck2-1024x313.jpg)

*   Format: resourcesxml
*   File Path: /var/rundeck/projects/Test-Job/etc/resources.xml
*   Generate: Yes

![Add Nodes to the Rundeck]({{ site.baseurl }}/assets/Add-Nodes-to-the-Rundeck3-1024x336.jpg)

Save it.  
Go to nodes and you can see the nodes.

![Add Nodes to the Rundeck]({{ site.baseurl }}/assets/Add-Nodes-to-the-Rundeck4.jpg)

## Option#3 Import from Directory

This is similar to the previous step. But here we'll give the existing project's resources.xml file's directory. It'll automatically scan and the directory and import the nodes.  
Go to Project Settings --> Edit Nodes --> Configure nodes --> Add Source.  
Select Directory.

![Add Nodes to the Rundeck]({{ site.baseurl }}/assets/Add-Nodes-to-the-Rundeck5.jpg)

## Create Login for Rundeck on Nodes

Now your nodes are added, But still, Rundeck will not control anything on these nodes. Because we need to create a user for Rundeck to login via SSH. By defaultrundeck user has SSH key (both public and private) in its home directory `(/var/lib/rundeck/.ssh/id_rsa)`. So copy the id_rsa.pub contents to other nodes.

{% highlight shell %}
cat /var/lib/rundeck/.ssh/id_rsa.pub  

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABxxxxxxxxxxxWZVfPZ53GtpnlSact83ZTX7+FL7KkgPvJzUhkiGIwxxthOZMXrO3pBaON7OCbhwv4QxkrfphBtJe2jHPbJbc1TLw803
{% endhighlight %}


Login to your nodes and run the following commands. This will create an user called rundeck and copy the id_rsa.pub as SSH key. Also make this user as a sudo user.

**For CentOS:**

{% highlight shell %}
adduser rundeck    
mkdir -p /home/rundeck/.ssh  

# Replace the "ssh-rsa ...." with your id_rsa.pub  
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABxxxxxxxxxxxxxWZVfPZ53GtpnlSact83ZTX7+FL7KkgPvJzUhkiGIwxxthOZMXrO3pBaON7OCbhwv4QxkrfphBtJe2jHPbJbc1TLw803" >>  /home/rundeck/.ssh/authorized_keys  
chown rundeck:rundeck /home/rundeck/  
echo "rundeck ALL=(ALL)  NOPASSWD: ALL" >> /etc/sudoers
{% endhighlight %}


**For Ubuntu:**

{% highlight shell %}
adduser rundeck  --disabled-password  
mkdir -p /home/rundeck/.ssh  

# Replace the "ssh-rsa ...." with your id_rsa.pub  
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABxxxxxxxxxxWZVfPZ53GtpnlSact83ZTX7+FL7KkgPvJzUhkiGIwxxthOZMXrO3pBaON7OCbhwv4QxkrfphBtJe2jHPbJbc1TLw803" >>  /home/rundeck/.ssh/authorized_keys  
chown rundeck:rundeck /home/rundeck/  
echo "rundeck ALL=(ALL)  NOPASSWD: ALL" >> /etc/sudoers
{% endhighlight %}

