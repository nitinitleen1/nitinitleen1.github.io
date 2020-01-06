---
title: Where GCP Internal TCP Load Balancer Fails
date: 2019-10-29 13:30:00 +0530
description: GCP Internal TCP load balancer route the traffic to the same node the
  traffic source is the node which is under the load balancer
categories:
- GCP
tags:
- gcp
- networking
- load balancer
image: "/assets/Where GCP Internal TCP Load Balancer Fails.png"
caption: "Photo by [chinagdg](https://chinagdg.org/2019/05/google-cloud-networking-in-depth-cloud-load-balancing-deconstructed/)"

---
GCP's Load balancers are globally scalable and its the unique identify for GCP while comparing its competitors. Generally GCP's networking is very strong and mature than other Cloud providers.  Recently I was working with a SQL Server setup which integrates the GCP Internal TCP load balancer. During that PoC setup I found this strange behaviour and then I ignored this problem because I thought its something related to SQL server.

## The PoC Setup:

I wanted to reproduce this scenario in simple web server stack. So I created 2 apache web servers and put them under the Internal TCP load balancer.

* **Web Server 1**: the index page will show `This is from Node1`
* **Web Server 2**: the index page will show `This is from Node2`
* **Load balancer IP:** 10.128.0.46

The health check is passed and Im able to see both nodes are healthy. Then I tried to CURL the load balancer's IP from the other VM which is on the same subnet. The traffic is routed to node 1 and second time node2. Till now everything looks good.

### Curl from a VM in the same subnet:
{% highlight shell %}
    # Curl 1st time
    curl 10.128.0.46
    <html>
            <body>
                    <H1> This is from Node1 </H2>
            </body>
    </html>
    
    # Curl 2nd time
    
    curl 10.128.0.46
    <html>
            <body>
                    <H1> This is from Node2 </H2>
            </body>
    </html>
{% endhighlight %}

## The strange behaviour in my previous setup:

In my SQL Server setup the issue I faced is, Its an alwayson availability group setup and the TCP Load balancer will route the traffic to the Primary Node. [The complete setup of Configuring the external Load balancer for SQL server availability groups is here](https://medium.com/searce/configure-external-listener-for-always-on-availability-groups-in-gcp-e1ae1c9632d1). There I have some packages where I need to talk to the Primary Node. The package will be executing from the both primary and secondary. It tried to talk to the Load balancer IP. But from Primary node and other nodes in the subnet always properly reached the Primary node via the TCP load balancer. But the secondary server is not able to reach, instead it was showing the role is Secondary. Then I connected to SQL server using load balancer IP and print the node name. It was showing the secondary server's name. 

Then I noticed, the traffic is always routed to the Node 2 if Im trying to access the Load balancer IP from the node2. 

## Issue Verified: 

From apache webserver's PoC, I tried to curl the Load Balancer's from Node 1 and then Node2.

### Node 1:
{% highlight shell %}
    root@bhuvi-node1:/var/www/html# curl 10.128.0.46
    <html>
            <body>
                    <H1> This is from Node1 </H2>
            </body>
    </html>     
    root@bhuvi-node1:/var/www/html# curl 10.128.0.46
    <html>
            <body>
                    <H1> This is from Node1 </H2>
            </body>
    </html>      
    root@bhuvi-node1:/var/www/html# 
{% endhighlight %}

### Node 2:
{% highlight shell %}
    root@bhuvi-node1:/var/www/html# curl 10.128.0.46
    <html>
            <body>
                    <H1> This is from Node2 </H2>
            </body>
    </html>      
    root@bhuvi-node1:/var/www/html# curl 10.128.0.46
    <html>
            <body>
                    <H1> This is from Node2 </H2>
            </body>
    </html>    
    root@bhuvi-node1:/var/www/html# 
{% endhighlight %}

> Its proving that the internal TCP load balancer routes the traffic to the same node in the source packet is coming from the node which is part of the load balancer.

## The Cause for this routing:

The exact reason for this behaviour is not a bug or an issue. Its the design of the TCP load balancer in GCP. What happened is, the moment when you add the instance group to the load balancer's backend, then GCP will automatically add a route in your VM that the Load balancer's IP is the Local host's IP. 

### Node 1:
{% highlight shell %}
    sudo ip route list table local
    local 10.128.0.40 dev ens4 proto kernel scope host src 10.128.0.40 
    local 10.128.0.46 dev ens4 proto 66 scope host 
    broadcast 127.0.0.0 dev lo proto kernel scope link src 127.0.0.1 
    local 127.0.0.0/8 dev lo proto kernel scope host src 127.0.0.1 
    local 127.0.0.1 dev lo proto kernel scope host src 127.0.0.1 
    broadcast 127.255.255.255 dev lo proto kernel scope link src 127.0.0.1  
{% endhighlight %}

### Node 2:
{% highlight shell %}
    sudo ip route list table local
    local 10.128.0.41 dev ens4 proto kernel scope host src 10.128.0.41 
    local 10.128.0.46 dev ens4 proto 66 scope host 
    broadcast 127.0.0.0 dev lo proto kernel scope link src 127.0.0.1 
    local 127.0.0.0/8 dev lo proto kernel scope host src 127.0.0.1 
    local 127.0.0.1 dev lo proto kernel scope host src 127.0.0.1 
    broadcast 127.255.255.255 dev lo proto kernel scope link src 127.0.0.1 
{% endhighlight %}

Both nodes are showing that `local 10.128.0.46 dev ens4 proto 66 scope host` , so whenever we tried to access the load balancer's IP, then the OS route table will route the traffic to the same node.

> I have verified this with GCP support team.

## Is this a serious Issue: 

**Not at all.** No one will try to access the load balancer from the nodes which are under the load balancer(Except some cases like mine). 

## What about HTTP/HTTPS Load balancer?:

I tried to reproduce the same issue with HTTP/HTTPS load balancer. There I didn't see this problem.