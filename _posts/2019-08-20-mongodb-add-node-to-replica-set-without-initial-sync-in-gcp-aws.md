---
title: MongoDB Add Node To Replica Set Without Initial Sync In GCP/AWS
date: 2019-08-20 00:00:00 +0530
description: This blog describes how can we add a new node to MongoDB replica set
  without initial sync in GCP or AWS with a huge amount of data
categories:
- GCP
- MongoDB
tags:
- gcp
- mongodb
- aws
- snapshot
- replication
image: "/assets/MongoDB Add Node To Replica Set Without Initial Sync In GCP_gcp.jpg"

---
Adding a new node to the MongoDB replica set with huge amount of data will take a lot of time to perform the initial sync. Recently I was working on a replica set where I need to replace all the nodes in the existing shard and add a new node to the shard's replica set. The data size is 3TB on each shard. The entire infra is on GCP. I planned to do this activity with native approach, but later I realized it won't work as I expected.  

## The native approach:

In this approach, I just added the new node the replica set.

```shell
PRIMARY> rs.add("new-node:27017")
```

After 24hrs, I checked the amount of data that has been synced. You know what, its just 100GB. Even my nodes are having 16 core CPU and better network bandwidth. 

>In GCP, we can get the network throughput upto 16Gbps and its depends on the CPU Core. One core supports 2Gbps. So I can get the maximum throughput with my current configuration.

In AWS, its a different case, we have separate instance types. 

MongoDB supports file system level backup to resync the replica set. Because Journal files will help to make the data is consistent. 

> ### FROM MONGODB:
>
> Sync by Copying Data Files from Another Member
>
> This approach “seeds” a new or stale member using the data files from an existing member of the replica set. The data files **must** be sufficiently recent to allow the new member to catch up with the [oplog](https://docs.mongodb.com/manual/reference/glossary/#term-oplog). Otherwise the member would need to perform an initial sync.

> Also make sure the journal files should be located on the same data disk.

Yes, I have journaling enabled on all the mongodb nodes. 

## Rsync:

This time, I want use rsync command to manually sync the files from any one of the secondary server to the new node. I know it'll end up inconsistency files. But rsync knows which files got modified and we can run the rsync one more time. So it'll sync the modified files. 

The plan was,

1. Run rsync from Secondary server to the new server. 
2. Once the 1st rsync has been done, then stop the mongodb service on Secondary node.
3. Run the rsync again. This time it'll sync only the modified files. 
4. Start the mongodb service on the secondary once the rsync is done. 
5. Start the mongodb service on the new node. 

```shell
root@new-node# rsync -Pavz -e "ssh -i key.pem" bhuvi@10.10.10.10:/mongodb/data/ /mongodb/data/
```

This time, again the bandwidth problem. I got upto 200Mbps only. After 2.3TB it reduced to 10Mbps. 

### GCS:

This is same as the above method, but instead of sync the files between servers, this time sync to GCS using `gsutil` Its a command line to which supports rsync. 

```shell
root@new-node# gsutil -m rsync -r /mongodb/data/ gs://mongo-migration/secondary-node/
```

In this case, the data transfer is pretty fast. I got 500Mbps to 1Gbps. So the sync was done in few hours. 

* But few journal data files were not uploaded due to permission issue. Even I added the root user to mongod group. 
* Some files were not uploaded, because that time those files are in use and was doing some changes. 

So inconsistent files which end up with corruption on the data files.

```
2019-08-14T13:09:56.407+0000 E STORAGE  [initandlisten] WiredTiger error (-31803) 
[1565788196:406419][28166:0x7feda45c4600], file:WiredTiger.wt, 
WT_CURSOR.next: __schema_create_collapse, 
111: metadata information for source configuration "colgroup:collection-29962-5646082836428872281" not found: 
WT_NOTFOUND: item not found
```

##  Snapshots:

If you are familiar with public cloud platform then you already know that Snapshots are not consistent backups. I have already faced some issues with this snapshots when I used it for PostgreSQL. ([Here is a blog about that](https://thedataguy.in/dont-use-aws-ami-backup-ec2-database-server/))

> **NOTE** Once the snapshot restored, it'll not give the complete performance, it's need some time to restore all the blocks. But yes, you can add it as a secondary node, then later you can promote this node as Master. 

But in mongodb, its a different case, Journal files will make your data consistent. So lets give a try.

1. Take snapshot of the data volume from the existing secondary server. 
2. Create a volume from the snapshot.
3. Attach this volume to the New node.
4. Mount it on the `dbpath` and assign the permissions.
5. Make sure the `mongod.conf` has replica set and shard details. 
6. Start the mongodb on the new node.
7. Add the new node to the replica set. 

In my case, I used CentOS for the new node. Here are the list of commands we need to use.

#### On the new node:

```shell
service mongod stop
mount /dev/sdb /mongodb/data/  (replace the /dev/sdb with your block device and mount point as your dbpath)
chown -R mongod:mongod /mongodb/data/ 
chcon system_u:object_r:mongod_var_lib_t:s0 /mongodb/data 
restorecon /mongodb/data
```

If you are using mongodb with Key file auth for replication, then assign the below permissions for the key file.

```shell
chown 400 mongodb-keyfile 
chown mongod:mongod mongodb-keyfile 
chcon system_u:object_r:mongod_var_lib_t:s0 mongodb-keyfile
service mongod start
```

#### On Primary:

```shell
PRIMARY> rs.add("new-node:27017")
```

It'll take some time to catch up the lag. Then we are ready to use the new node. 

I remember 2 years before, I have done this on AWS. [https://dba.stackexchange.com/a/164391/105575](https://dba.stackexchange.com/a/164391/105575)