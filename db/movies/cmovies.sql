drop table if exists cmovies_fact;
drop table if exists cmovies_summary;
create table cmovies_fact (
adult    varchar(5),
belongs_to_collection    varchar(168),
budget    int,
genre1    varchar(15),
genre2    varchar(15),
genre3    varchar(15),
homepage    varchar(242),
id    int,
imdb_id    varchar(9),
original_language    varchar(2),
original_title    varchar(131),
overview    varchar(1411),
popularity    varchar(10),
poster_path    varchar(32),
production_companies    varchar(1135),
production_countries    varchar(217),
release_date    varchar(10),
revenue    varchar(10),
runtime    int,
spoken_languages    varchar(783),
status    varchar(30),
tagline    varchar(302),
title    varchar(131),
video    varchar(17),
vote_average    varchar(5),
vote_count    varchar(5)
);


load data local infile 'cmovies.tsv' into table cmovies_fact;

create table cmovies_summary as select 
adult,
genre1,
genre2,
genre3,
original_language,
status,
video,
vote_average
,
count(*) as count,
sum(budget) as budget,
sum(id) as id,
sum(runtime) as runtime
from cmovies_fact
 group by 
adult,
genre1,
genre2,
genre3,
original_language,
status,
video,
vote_average
;
