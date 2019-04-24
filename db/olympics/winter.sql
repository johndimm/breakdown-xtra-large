drop table if exists winter_fact;
drop table if exists winter_summary;
create table winter_fact (
Year    int,
City    varchar(22),
Sport    varchar(10),
Discipline    varchar(25),
Athlete    varchar(32),
Country    varchar(3),
Gender    varchar(5),
Event    varchar(33),
Medal    varchar(6)
);


load data local infile 'winter.tsv' into table winter_fact;

create table winter_summary as select 
City,
Sport,
Discipline,
Country,
Gender,
Event,
Medal
,
count(*) as count,
sum(Year) as Year
from winter_fact
 group by 
City,
Sport,
Discipline,
Country,
Gender,
Event,
Medal
;
