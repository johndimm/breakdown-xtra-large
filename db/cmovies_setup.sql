use olympics;

insert into breakdown_settings
(fact_table, summary_table, dimensions, measures, aggregates, detail_columns, page_title)
values
(   'cmovies_fact'
  , 'cmovies_summary'
  , 'genres,original_language,production_countries,spoken_languages,status,video,vote_average'
  , 'count,revenue,runtime,vote_count'
  , 'count(*) as count,avg(revenue) as revenue,avg(runtime) as runtime,avg(vote_count) as vote_count'
  , 'poster_path,original_title,overview'
  , 'Movies'
);

# call breakdown("country='France' and year=2002 and medal='BRONZE'", 'sport',"2");

# call breakdown("country='France' and year=2002", 'sport', "2");

# call breakdown("country='France'", "sport", "2");

