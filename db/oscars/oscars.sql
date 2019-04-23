drop table if exists oscars_fact;
drop table if exists oscars_summary;
create table oscars_fact (
Year    varchar(9),
Ceremony    int,
Award    varchar(137),
Winner    int,
Name    varchar(190),
Film    varchar(182)
);


load data local infile 'oscars.tsv' into table oscars_fact;

create table oscars_summary as select 
Year,
Award,
Name,
Film
,
count(*) as Oscars,
sum(Ceremony) as Ceremony,
sum(Winner) as Winner
from oscars_fact
 group by 
Year,
Award,
Name,
Film
;
