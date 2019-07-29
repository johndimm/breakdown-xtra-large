use breakdown;

insert into breakdown_sources
(name, fact_table, summary_table, dimensions, measures, aggregates, detail_columns, page_title, description, url, google_sheet)
values
(   'oscars'
  , 'oscars_fact'
  , 'oscars_fact'
  , 'Award,Name,Film,Year'
  , 'count(*)'
  , 'count(*)'
  , '*'
  , 'The Academy Awards'
  , 'Oscars over the years, by actor (director, producer, etc.) and film'
  , 'https://www.kaggle.com/theacademy/academy-awards'
  , 'https://docs.google.com/spreadsheets/d/1zeWD7RUNg3bdZNlMcUtGEmR7VdWQH6UeSjnoLt1BEXI/edit?usp=sharing'
);

# call breakdown("country='France' and year=2002 and medal='BRONZE'", 'sport',"2");

# call breakdown("country='France' and year=2002", 'sport', "2");

# call breakdown("country='France'", "sport", "2");

