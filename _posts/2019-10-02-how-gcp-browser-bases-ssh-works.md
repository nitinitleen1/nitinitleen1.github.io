---
title: How GCP Browser Based SSH Works
date: 2019-10-02 00:02:00 +0530
description: 'A blog port that explains about how GCP browser based SSH works internally.
  You can access the VM without allowing your Public IP address. '
categories:
- GCP
tags:
- gcp
- ssh
- security
image: "/assets/How GCP Browser Based SSH Works-cover.jpg"

---
If you are using GCP platform and lazy to setup VPN or bastion host, then you may familiar with using SSH connection via a browser. Yeah, its just one click to login to the Linux VM. Here are some questions for you.

1. How many of you think how this actually works in the backend?
2. Can we access the VM (via browser SSH) without whitelist our Public IP address in the firewall rule?
3. Why the VM is not accessible via Browser SSH even though we whitelisted our Public IP?

I had a situation to dig deeper into understanding this concept.

## My Problematic situation:

I was launching a new VM in GCP and tagged with `allow-office-ssh`. Then created a Firewall rule which allows `Port 22` from the IP address `X.X.X.X`(my office IP address) to the target tag `allow-office-ssh`. Once the VM came to an active state, I tried to telnet on port 22. It was working fine.

But I don't any username and password to login, So I thought to access the VM via browser then create the user. But unfortunately Im not able to access the VM via Browser.  This made me go deep into this functionality.

## How Browser SSH Works:

Here is an illustration that I have in my mind how this actually works.

![](/assets/How GCP Browser Based SSH Works.jpg)

1. There is no need to allow your IP Address in the firewall rule.
2. The communication is happening between the VM and Google's SSH Proxy(i don't know the right term, so Im using the term proxy).
3. Your browser is just talking to the Proxy layer.
4. The Proxy layer is actually talking to the VM.
5. Its more or less a port forwarding or SSH tunneling.

## How GCP's proxy can access the VM?

As per GCP's security policy, no one can access the VM without allowing their IP address. Then how this proxy is accessing it?

There is no way to proxy to access the VM. But Google has some static IP ranges which are assigned to its proxy layer. By whitelisting that IP range, they can talk to your VM.

**From the GCP doc:**

> Source IP addresses for browser-based SSH sessions are dynamically allocated by GCP Console and can vary from session to session. For the feature to work, you must allow connections either from any IP address or from Google's IP address range which you can retrieve using [public SPF records](https://support.google.com/a/answer/60764).

If you run the below commands, you can get the IP address range for proxy layer.

    nslookup -q=TXT _netblocks.google.com 8.8.8.8
    nslookup -q=TXT _netblocks2.google.com 8.8.8.8
    nslookup -q=TXT _netblocks3.google.com 8.8.8.8

**For eg:**

    nslookup -q=TXT _netblocks.google.com 8.8.8.8
    
    Server:		8.8.8.8
    Address:	8.8.8.8#53
    
    Non-authoritative answer:
    _netblocks.google.com	text = "v=spf1 ip4:35.190.247.0/24 ip4:64.233.160.0/19 ip4:66.102.0.0/20 ip4:66.249.80.0/20 ip4:72.14.192.0/18 ip4:74.125.0.0/16 ip4:108.177.8.0/21 ip4:173.194.0.0/16 ip4:209.85.128.0/17 ip4:216.58.192.0/19 ip4:216.239.32.0/19 ~all"
    
    Authoritative answers can be found from:

You can see a bunch of Public IP address. Right now we have the following IP ranges for accessing the VM via the browser.

    35.190.247.0/24
    64.233.160.0/19
    66.102.0.0/20
    66.249.80.0/20
    72.14.192.0/18
    74.125.0.0/16
    108.177.8.0/21
    173.194.0.0/16
    209.85.128.0/17
    216.58.192.0/19
    216.239.32.0/19
    172.217.0.0/19
    172.217.32.0/20
    172.217.128.0/19
    172.217.160.0/20
    172.217.192.0/19
    108.177.96.0/19
    35.191.0.0/16
    130.211.0.0/22

Once you create a firewall rule which allows Port 22 from the above IP addresses, then we can access the VM via browser. Hope you learned something new today.

## My Personal Suggestion:

But I always recommend that do not use this for production. Because I had some nightmares because of this. The VM goes offline due to the `live host migration`. After that, the services are not started. I tried to access it via browser. Unfortunately, that time GCP's some services also down which establish the connection between the browser and the VM. So use VPN or bastion host for this.

Happy SSH !!!