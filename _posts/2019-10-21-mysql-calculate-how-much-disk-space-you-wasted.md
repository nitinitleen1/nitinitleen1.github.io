---
title: MySQL Calculate How Much Disk Space You Wasted
date: 2019-10-21 10:43:00 +0530
description: MySQL calculate the fragmentation size for all tables. Get the wasted
  space in GB.
categories:
- MySQL
tags:
- mysql
- shell
- script
- linux
image: "/assets/MySQL Calculate How Much Disk Space You Wasted.jpg"

---
Its not the new term for DBAs. MySQL has an awesome parameter `innodb-file-per-tables` allows MySQL to create separate files for each tables. This helped a lot to manage the disk space in more efficient way. But when we perform a large batch job for delete or update the data in MySQL tables, you may face this fragmentation issue. Comparing with SQL server, MySQL's fragmentation is not high. I had a similar situation where my Disk space was consuming 80% and when I check the huge files in OS, one table's `idb` file consumed 300GB+. I know it has some wasted blocks(but not actually wasted, MySQL will use this space, it'll not return this to OS) Then I checked the `information schema` to find out the data size and its index size. It was 27GB only. Then I realize, we did a batch operation to delete many billions of records in that table.

## Thanks to Rolando - MySQL DBA:

When I searched the similar issue on [dba stackexchange](https://dba.stackexchange.com/questions/142653/mysql-ibd-file-is-too-big/176812), I found this great script by [Rolando](https://dba.stackexchange.com/users/877/rolandomysqldba). He had given this script to calculate the wasted size for a single table. I just add some [South Indian Masala](https://food.ndtv.com/lists/10-best-south-indian-recipes-736459) on top of it.(just for fun). You can use the below script to identify the wasted space/fragmented space in GB for all tables in a database. 

## Parameters:

* **DB** - Your Database Name
* **MYSQL_DATA_DIR** - Your Data directory for MySQL
* **MYSQL_USER** - MySQL user to query the `information schema`.
* **MYSQL_PASS** - Password for the MySQL user.

{% highlight shell %}
    DB='mydb'
    MYSQL_DATA_DIR='/mysqldata'
    MYSQL_USER=sqladmin
    MYSQL_PASS='mypass!'
    MYSQL_CONN="-u${MYSQL_USER} -p${MYSQL_PASS}"
    
    Tables=`ls -l $MYSQL_DATA_DIR/$DB/ | grep ibd | awk -F' ' '{print $9}' | sed -e 's/\.ibd//g'`
    for x in `echo $Tables`
    do
    TB=$x
    SQL="SELECT data_length+index_length FROM information_schema.tables"
    SQL="${SQL} WHERE table_schema='${DB}' AND table_name='${TB}'"
    TBLSIZE_OPER=`ls -l $MYSQL_DATA_DIR/${DB}/${TB}.ibd | awk -F' ' '{print $5}'`
    TBLSIZE_INFO=`mysql ${MYSQL_CONN} -ANe"${SQL}"`
    TBLSIZE_FRAG=$(($TBLSIZE_OPER - $TBLSIZE_INFO))
    TBLSIZE_FRAG_GB=$(($TBLSIZE_FRAG / 1073741824))
    echo ${TB} ${TBLSIZE_FRAG_GB}
    done
{% endhighlight %}

## Execution
Its better to create the script as a shell file and print the output in a file.

{% highlight shell %}
./script.sh > output.txt
{% endhighlight %}

