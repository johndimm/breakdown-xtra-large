drop table if exists olympic_medals_fact;
drop table if exists olympic_medals_summary;
create table olympic_medals_fact (
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


load data local infile 'olympic_medals.tsv' into table olympic_medals_fact IGNORE 1 LINES;

alter table olympic_medals_fact
add column Country varchar(255);

update olympic_medals_fact as oly
join dictionary_fact as d on d.code = oly.Country_code
set oly.Country = d.country
;


create table olympic_medals_summary as select 
Season,
Year,
City,
Sport,
ifnull(dict.country,olympic_medals_fact.Country) as Country,
Gender,
Event,
Medal
,
count(*) as Medals
from olympic_medals_fact
left join dictionary_fact as dict on dict.code = olympic_medals_fact.Country

 group by 
Season,
Year,
City,
Sport,
Country,
Gender,
Event,
Medal
;
