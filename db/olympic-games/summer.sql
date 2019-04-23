drop table if exists summer_fact;
drop table if exists summer_summary;
create table summer_fact (
Year    int,
City    varchar(21),
Sport    varchar(17),
Discipline    varchar(21),
Athlete    varchar(48),
Country    varchar(3),
Gender    varchar(5),
Event    varchar(50),
Medal    varchar(6)
);


load data local infile 'summer.tsv' into table summer_fact;

create table summer_summary as select 
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
from summer_fact
 group by 
City,
Sport,
Discipline,
Country,
Gender,
Event,
Medal
;
