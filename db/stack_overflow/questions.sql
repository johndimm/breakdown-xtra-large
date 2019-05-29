drop table if exists stack_overflow_questions;
create table stack_overflow_questions (
name    varchar(22),
metadata text
);


load data local infile 'questions.tsv' into table stack_overflow_questions ignore 1 lines;

