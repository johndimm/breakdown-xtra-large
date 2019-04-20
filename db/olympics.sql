use olympics;

insert into breakdown_settings
(fact_table, summary_table, dimensions, measures, aggregates, detail_columns, page_title)
values
(   'olympics'
  , 'olympics_summary'
  , 'country,sport,event,year,medal'
  , 'medals'
  , 'sum(medals) as medals'
  , '*'
  , 'Olympic Medals'
);

call breakdown("country='France' and year=2002 and medal='BRONZE'", 'sport',"2");

# call breakdown("country='France' and year=2002", 'sport', "2");

# call breakdown("country='France'", "sport", "2");

