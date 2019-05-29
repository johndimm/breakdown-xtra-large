/*---------
Name : 50
Categories : 7
Funding : 45
Location : 19

, 'Name,Categories,Location'

, 'count,Funding'

. 'count(*) as count,sum(Funding) as Funding'
------------*/

drop table if exists forbes_fact;
drop table if exists forbes_summary;
create table forbes_fact (
Name    varchar(17),
Categories    varchar(19),
Funding    int,
Location    varchar(25)
);


load data local infile 'forbes.tsv' into table forbes_fact ignore 1 lines;

create table forbes_summary as select 
Name,
Categories,
Location
,
count(*) as count,
sum(Funding) as Funding
from forbes_fact
 group by 
Name,
Categories,
Location
;
