use breakdown;

insert into breakdown_sources
(name, fact_table, summary_table, dimensions, measures, aggregates, detail_columns, page_title, description, url)
values
(   'oscars'
  , 'oscars_fact'
  , 'oscars_summary'
  , 'Award,Name,Film,Year'
  , 'Nominations,Oscars,AvgYear'
  , 'sum(Oscars) as Nominations,cast(avg(Year) as unsigned) as AvgYear,sum(Winner) as Oscars'
  , '*'
  , 'The Academy Awards'
  , 'What actors and films have received the most Oscars?'
  , 'https://www.kaggle.com/theacademy/academy-awards'
);

# call breakdown("country='France' and year=2002 and medal='BRONZE'", 'sport',"2");

# call breakdown("country='France' and year=2002", 'sport', "2");

# call breakdown("country='France'", "sport", "2");

