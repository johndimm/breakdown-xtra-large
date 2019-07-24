use breakdown;

insert into breakdown_sources
(name, fact_table, summary_table, dimensions, measures, aggregates, detail_columns, page_title, description, url, google_sheet)
values
(  'Forbes'
  ,'forbes_fact'
  , 'forbes_summary'
  , 'Categories,Location,Name'
  , 'Funding $M,count'
  , 'sum(Funding) as `Funding $M`,count(*) as count'
  , '*'
  , 'Forbes Fintech 50 for 2019'
  , 'The Most Innovative Fintech Companies In 2019'
  , 'https://www.forbes.com/fintech/2019/#436c6c2f2b4c'
  , 'https://docs.google.com/spreadsheets/d/1D9spcpW0xj2SA9VG5qxqVHMTmJYPCSXyYSWIJ7pRBjM/edit?usp=sharing'
);

# call breakdown("country='France' and year=2002 and medal='BRONZE'", 'sport',"2");

# call breakdown("country='France' and year=2002", 'sport', "2");

# call breakdown("country='France'", "sport", "2");

