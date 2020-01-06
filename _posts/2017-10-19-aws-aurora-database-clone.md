---
layout: post
title: What Is AWS Aurora Database Clone
date: 2017-10-19 16:46:31.000000000 +00:00
description: Clone takes the database pages from the source database, So no need to copy the data from source database to cloned database. It saves the storage.
categories:
- AWS
tags:
- aurora
- aws
- mysql
- rds

---

![AWS Aurora Database Cloning]({{ site.baseurl }}/assets/What-Is-AWS-Aurora-Database-Cloning.jpeg)


Aurora is one of the greatest inventions of AWS's managed database services. I recommend this everyone to use this instead of MySQL.
A few days back they have announced a new feature called Cloning the database. Initially, I taught this is same as restoring the database from the snapshot or point in time restore. But after reading the documentation, I was wondered about this feature and it pushed me to write this blog.

## How it works:

Basically its a Copy-on-Write Protocol. While cloning the database it'll take the database pages from the source database, So no need to copy the data from source database to cloned database. Also no additional storage for this. Then if you modify anything in the existing data pages on Source or Cloned database it won't apply it to the actual data pages, instead, it'll create one more additional data page file and apply the changes there.

To understand this, I have pasted its process from the AWS documentation.

## Before database cloning:

Data in a source database is stored in pages. In the following diagram, the source database has 4 pages.

![What Is AWS Aurora Database Cloning]({{ site.baseurl }}/assets/What-Is-AWS-Aurora-Database-Cloning1.png)

## After database cloning:

As shown in the following diagram, there are no changes in the source database. Both the source database and the clone database point to the same 4 pages. None of the pages have been physically copied, so no additional storage is required.

![What Is AWS Aurora Database Cloning]({{ site.baseurl }}/assets/What-Is-AWS-Aurora-Database-Cloning2.png)


## When a change occurs on the source database:

In the following example, the source database makes a change to the data in Page 1. Instead of writing to the original Page 1, additional storage is used to create a new page, called Page 1'. The source database now points to the new Page 1′, as well as to Page 2, 3, and 4. The clone database continues to point to Page 1 through Page 4.

![What Is AWS Aurora Database Cloning]({{ site.baseurl }}/assets/What-Is-AWS-Aurora-Database-Cloning3.png)


## When a change occurs on the clone database:

In the following diagram, the clone database has also made a change, this time in Page 4. Instead of writing to the original Page 4, additional storage is used to create a new page, called Page 4'. The source database continues to point to Page 1′, as well as Page 2 through Page 4, but the clone database now points to Page 1 through Page 3, as well as Page 4′.

![What Is AWS Aurora Database Cloning3]({{ site.baseurl }}/assets/What-Is-AWS-Aurora-Database-Cloning4.png)


## Limitations:

-   We can create upto 15 clones from any sources or clone to clone.
-   We can't clone this to another region.
-   Also we can't clone it to another account.

## Pros:

-   Less time to provision.
-   No additional cost for storage at the point of creation, so if we use this for reporting purpose then no cost for the storage.

## Cons:

-   But if we cloned a database then the current data pages change(in the source) will apply on the new pages, so it'll involve additional cost for the new pages.
