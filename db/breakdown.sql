use olympics;

drop table if exists breakdown_settings;
create table breakdown_settings
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


drop procedure if exists get_breakdown_settings;
delimiter //
create procedure get_breakdown_settings(_dummy varchar(1))
begin
  select * from breakdown_settings;
end //
delimiter ;


drop function if exists clause;
delimiter //
create function clause(intro varchar(255), param varchar(255))
returns varchar(255)
READS SQL DATA
DETERMINISTIC
begin
  set @clause = '';
  if (param != '')
  then
    set @clause = concat(intro, param);
  end if;
  return @clause;
end //
delimiter ;

drop procedure if exists breakdown;
delimiter //
create procedure breakdown (
  _source varchar(64),
  _where varchar(1024),
  _group_by varchar(255),
  _order_by varchar(255))
begin
  #
  # Same for all queries.
  #
  select fact_table, summary_table, aggregates
    into @fact_table, @summary_table, @aggregates
  from breakdown_settings
  where name = _source;

  #
  # Define this breakdown.
  #
  set @where_clause = (select clause(' where ', _where));
  set @group_by_clause = (select clause(' group by ', _group_by));
  set @order_by_clause = (select clause(' order by ', _order_by));

  set @cmd = (
    select concat(
		"select ", _group_by,
		", ", @aggregates,
		" from ", @summary_table, ' ',
		@where_clause,
		@group_by_clause,
        @order_by_clause, ' limit 2000') as 'cmd'
    from breakdown_settings
    where name = _source
  );

#  select @cmd;

  PREPARE stmt FROM @cmd;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

end //
delimiter ;


drop procedure if exists dim_counts;
delimiter //
create procedure dim_counts (_source varchar(64), _where varchar(1024), _count_distinct varchar(1024))
begin
  #
  # Same for all queries.
  #
  select fact_table, summary_table, aggregates
    into @fact_table, @summary_table, @aggregates
  from breakdown_settings
  where name = _source;

  set @where_clause = (select clause(' where ', _where));

  set @cmd = (
    select concat(
		"select ", _count_distinct,
		" from ", @summary_table,
		' ', @where_clause, ';') as 'cmd'
    from breakdown_settings
    where name = _source
  );

  # select @cmd; #  _where, _count_distinct;

  PREPARE stmt FROM @cmd;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

end //
delimiter ;

drop procedure if exists detail;
delimiter //
create procedure detail (_source varchar(64), _where varchar(1024), _limit varchar(32))
begin
  #
  # Same for all queries.
  #
  select fact_table, fact_table, detail_columns
    into @fact_table, @fact_table, @detail_columns
  from breakdown_settings
  where name = _source;


  #
  # Define this breakdown.
  #
  set @where_clause = (select clause(' where ', _where));

  set @cmd = (
    select concat(
		'select ', @detail_columns,
		' from ', @fact_table,
		' ', @where_clause,
		_limit) as 'cmd'
    from breakdown_settings
    where name = _source
  );

#  select @cmd;

  PREPARE stmt FROM @cmd;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

end //
delimiter ;
