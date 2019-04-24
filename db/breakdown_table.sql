drop table if exists breakdown_sources;
create table breakdown_sources
(
  name varchar(64),
  fact_table varchar(255),
  summary_table varchar(255),
  dimensions varchar(255),
  measures varchar(255),
  aggregates varchar(255),
  detail_columns varchar(255),
  page_title varchar(255),
  description varchar(255),
  url varchar(255)
);

