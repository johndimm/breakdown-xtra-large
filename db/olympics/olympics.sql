drop table if exists olympics_fact;
drop table if exists olympics_summary;
create table olympics_fact (
Season    varchar(6),
Year    int,
City    varchar(22),
Sport    varchar(17),
Discipline    varchar(25),
Athlete    varchar(48),
Country_code varchar(3),
Gender    varchar(5),
Event    varchar(50),
Medal    varchar(6)
);


load data local infile 'olympics.tsv' into table olympics_fact IGNORE 1 LINES;

alter table olympics_fact
add column Country varchar(255);

update olympics_fact as oly
join dictionary_fact as d on d.code = oly.Country_code
set oly.Country = d.country
;


create table olympics_summary as select 
Season,
Year,
City,
Sport,
Discipline,
ifnull(dict.country,olympics_fact.Country) as Country,
Gender,
Event,
Medal
,
count(*) as Medals
from olympics_fact
left join dictionary_fact as dict on dict.code = olympics_fact.Country

 group by 
Season,
Year,
City,
Sport,
Discipline,
Country,
Gender,
Event,
Medal;

create index idx_olympic1 on olympics_summary(Season, Year, City, Sport, Discipline, Country, Gender, Event, Medal);
