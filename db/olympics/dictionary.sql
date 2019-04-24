drop table if exists dictionary_fact;
drop table if exists dictionary_summary;
create table dictionary_fact (
Country    varchar(32),
Code    varchar(3),
Population    int,
`GDP per Capita`    varchar(16)
);


load data local infile 'dictionary.tsv' into table dictionary_fact;

