use breakdown;

insert into breakdown_sources
(name, fact_table, summary_table, dimensions, measures, aggregates, detail_columns, page_title, description, url)
values
(  'olympics'
  ,'olympics_fact'
  , 'olympics_summary'
  , 'Sport,Discipline,Event,Country,Medal,Year,Season,Gender,City'
  , 'Medals'
  , 'sum(Medals) as Medals'
  , '*'
  , 'Olympic Medals'
  , 'Which countries and athletes have won the most medals at the Olympic games?'
  , 'https://www.kaggle.com/the-guardian/olympic-games'
);

# call breakdown("country='France' and year=2002 and medal='BRONZE'", 'sport',"2");

# call breakdown("country='France' and year=2002", 'sport', "2");

# call breakdown("country='France'", "sport", "2");

