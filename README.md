# breakdown

Breakdown is a tool for slicing and dicing data. It shows the distribution of a subset of data over a given dimension according to a series of measures or metrics, where the subset is defined by selecting values for other dimensions, but it feels simpler than that.

- click on a dimension to open it up and see what's inside
- click on a dimension value to select it and restrict further results to that value
- the interactive report functions as its own query generator
- each click generates a new report
- every choice you make as a user is supported by metrics
- no empty pages -- every link produces data

Under the hood

- react/php/mysql
- database access is restricted
  - nothing but stored procedures
  - prepared statements with parameter replacement
  - javascript browser fetch with POST
- works with data organized as dimensions and measures
  - dimensions are usually strings with cardinality under 1000 or so
  - measures are usually numbers that can be aggregated in some way

The online demo with olympic medals and oscars:

[breakdown](http://104.196.23.166/breakdown/breakdown/)

Video demo:

[![breakdown](https://img.youtube.com/vi/Utme6aFwtxM/0.jpg)](https://youtu.be/Utme6aFwtxM)

# Installation

### 1. clone the repo

```
git clone https://github.com/johndimm/breakdown.git
```

### 2. install mysql

https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/

### 3. create a database

```
mysql> create database breakdown;
```

### 4. create and load the olympics test dataset

```
cd db/olympics
./run.sh
```

### 5. register the olympics dataset

```
cd db
./run.sh
```

### 6. run a local http server

https://gist.github.com/jgravois/5e73b56fa7756fd00b89

Point the server to the breakdown directory.

### 7. configure the app to connect to your database

Edit the file breakdown/php/mysql_connect.php.

```
<?php
    // Installation:  supply the missing credentials
    $mysql_host = "";
    $mysql_user = "";
    $mysql_password = "";
    $mysql_database = "";
?>
```

Test from the command line to see that the data is ready.

```
$php mysql.php
[{"name":"olympics","fact_table":"olympics_fact","summary_table":"olympics_summary","dimensions":"Sport,Discipline,Athlete,Event,Country,Medal,Year,Season,Gender,City","measures":"Medals","aggregates":"count(*) as Medals","detail_columns":"*","page_title":"Olympic Medals","description":"up to the 2014 Winter Games","url":"https:\/\/www.kaggle.com\/the-guardian\/olympic-games","dim_metadata_table":"","google_sheet":"https:\/\/docs.google.com\/spreadsheets\/d\/1obx8JHesu-FGVUKsm6cX-Use9V8PZx-yqJmJHu095DE\/edit?usp=sharing"}]Johns-MBP:php johndimm$
```

### 8. navigate to the index.html file

http://localhost/breakdown/
