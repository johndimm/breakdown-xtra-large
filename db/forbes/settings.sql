use breakdown;

insert into breakdown_sources
(name, fact_table, summary_table, dimensions, measures, aggregates, detail_columns, page_title, description, url)
values
(  'Forbes'
  ,'forbes_fact'
  , 'forbes_summary'
  , 'Categories,Location,Name'
  , 'Funding,count'
  , 'sum(Funding) as Funding,count(*) as count'
  , '*'
  , 'Forbes Fintech 50 for 2019'
  , 'The Most Innovative Fintech Companies In 2019'
  , 'https://www.forbes.com/fintech/2019/#436c6c2f2b4c'
);

# call breakdown("country='France' and year=2002 and medal='BRONZE'", 'sport',"2");

# call breakdown("country='France' and year=2002", 'sport', "2");

# call breakdown("country='France'", "sport", "2");

