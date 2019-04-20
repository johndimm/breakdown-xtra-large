drop table if exists cmovies_fact;
drop table if exists cmovies_summary;
create table cmovies_fact (
adult    varchar(722),
belongs_to_collection    varchar(168),
budget    varchar(32),
genres    varchar(39),
homepage    varchar(242),
id    varchar(10),
imdb_id    varchar(9),
original_language    varchar(3),
original_title    varchar(131),
overview    varchar(1411),
popularity    varchar(71),
poster_path    varchar(131),
production_companies    varchar(1135),
production_countries    varchar(217),
release_date    varchar(10),
revenue    int,
runtime    int,
spoken_languages    varchar(783),
status    varchar(15),
tagline    varchar(302),
title    varchar(105),
video    varchar(5),
vote_average    varchar(3),
vote_count    int
);


load data local infile 'cmovies.tsv' into table cmovies_fact;

create table cmovies_summary as select 
adult,
genres,
original_language,
production_countries,
spoken_languages,
status,
video,
vote_average
,
sum(revenue) as revenue,
sum(runtime) as runtime,
sum(vote_count) as vote_count
from cmovies_fact
 group by 
adult,
genres,
original_language,
production_countries,
spoken_languages,
status,
video,
vote_average
;
