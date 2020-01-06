---
layout: post
title: How To Convert MySQL Two Digit Year To Four Digit Year
date: 2018-07-20 15:27:29.000000000 +00:00
description: While working with MySQL datetime sometime it'll messup. Here I have worked datetime column to convert two digit year to four digit year.

categories:
- MySQL
tags:
- csv
- datatype
- mysql

---
![How To Convert MySQL Two Digit Year To Four Digit Year]({{ site.baseurl }}/assets/How-To-Convert-MySQL-Two-Digit-Year-To-Four-Digit-Year.png)

Today I was working with a small MySQL data set. The data provided by a CSV file and needed to load it into AWS RDS MySQL. Since the RDS does not support the Load data inline. So I have manually convert the CSV file to .sql file. But the problem statement is, in CSV the date time column had two digit year format and while converting into sql it considered the day part as year and automatically added 20  in the beginning. MySQL has makedate function , but it didn't work for me. My entire data for the year 2018.

The two digit format in CSV
---------------------------
{% highlight shell %}

1.  dd/mm/yy hh:mm:ss
2.  30-05-18  14:57:19
3.  30-05-18  14:55:15
4.  19-05-18  04:15:15
5.  18-05-18  02:11:53
6.  17-05-18  22:14:24
{% endhighlight %}

Converted sql file
------------------
{% highlight shell %}

1.  yyyy/mm/dd hh:mm:ss
2.  2030-05-18  14:57:19
3.  2030-05-18  14:55:15
4.  2019-05-18  04:15:15
5.  2018-05-18  02:11:53
6.  2017-05-18  22:14:24
{% endhighlight %}

Create the table and load the test data
---------------------------------------
{% highlight sql %}

create table csv_date  (date varchar(20));
insert into csv_date values  ('2030-05-18 14:57:19');
insert into csv_date values  ('2030-05-18 14:55:15');
insert into csv_date values  ('2019-05-18 04:15:15');
insert into csv_date values  ('2018-05-18 02:11:53');
insert into csv_date values  ('2017-05-18 22:14:24');
{% endhighlight %}

Convert two digit to four digit in MySQL:
-----------------------------------------

-   Create a temporary table same as the original table but make the column datatype as datetime data type. 
-   Select the original table and trim the first two characters from the yyyy.
-   Add 20 in the year (dd-mm-[20] yy).
-   Do str_to_date to mention this as a datetime column.
-   Drop the old table and rename the temporary table.
{% highlight sql %}

-- Create the temp table
create table fix_date (date datetime);

-- insert the value (trim the 20)
insert into new select str_to_date(concat((substr(substr(date,3,length(date)),1,6)),'20',substr(substr(date,3,length(date)),7)), "%d-%m-%Y %H:%i:%s") from csv_date;

select * from fix_date;
2018-05-30 14:57:19
2018-05-30 14:55:15
2018-05-19 04:15:15
2018-05-18 02:11:53
2018-05-17 22:14:24

-- Replace the table
drop table csv_date;
alter table fix_date rename to csv_date;
{% endhighlight %}
