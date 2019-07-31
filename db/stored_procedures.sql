
drop procedure if exists get_breakdown_datasets;
delimiter //
create procedure get_breakdown_datasets(_dummy varchar(1))
begin
  select * from breakdown_datasets;
end //
delimiter ;


drop procedure if exists get_dim_metadata;
delimiter //
create procedure get_dim_metadata(_tableName varchar(255))
begin
  set @cmd = concat("select name, metadata from ", _tableName);

  PREPARE stmt FROM @cmd;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
end //
delimiter ;

drop function if exists clause;
delimiter //
create function clause(intro varchar(255), param text)
returns text
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
  _dataset varchar(64),
  _where text,
  _group_by varchar(255),
  _order_by varchar(255))
begin
  #
  # Same for all queries.
  #
  select fact_table, summary_table, aggregates
    into @fact_table, @summary_table, @aggregates
  from breakdown_datasets
  where name = _dataset;

  #
  # Define this breakdown.
  #
  set @group_by = concat("`", _group_by, "`");

  set @where_clause = (select clause(' where ', _where));
  set @group_by_clause = (select clause(' group by ', @group_by));
  set @order_by_clause = (select clause(' order by ', _order_by));

  set @cmd = (
    select concat(
		"select ", @group_by,
		", ", @aggregates,
		" from ", @summary_table, ' ',
		@where_clause,
		@group_by_clause,
        @order_by_clause, ' limit 2000') as 'cmd'
    from breakdown_datasets
    where name = _dataset
  );

  # select @cmd as cmd, _group_by as group_by;

  PREPARE stmt FROM @cmd;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

end //
delimiter ;


drop procedure if exists dim_counts;
delimiter //
create procedure dim_counts (_dataset varchar(64), _where text, _count_distinct text)
begin
  #
  # Same for all queries.
  #
  select fact_table, summary_table, aggregates
    into @fact_table, @summary_table, @aggregates
  from breakdown_datasets
  where name = _dataset;

  set @where_clause = (select clause(' where ', _where));

  set @cmd = (
    select concat(
		"select ", _count_distinct,
		" from ", @summary_table,
		' ', @where_clause, ';') as 'cmd'
    from breakdown_datasets
    where name = _dataset
  );

  # select @cmd; #  _where, _count_distinct;

  PREPARE stmt FROM @cmd;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

end //
delimiter ;

drop procedure if exists detail;
delimiter //
create procedure detail (_dataset varchar(64), _where text, _orderBy varchar(64), _limit varchar(32))
begin
  #
  # Same for all queries.
  #
  select fact_table, fact_table, detail_columns
    into @fact_table, @fact_table, @detail_columns
  from breakdown_datasets
  where name = _dataset;

  #
  # Define this breakdown.
  #
  set @where_clause = (select clause(' where ', _where));
  set @order_by = (select clause(' order by ', _orderBy));

  set @cmd = (
    select concat(
		'select ', @detail_columns,
		' from ', @fact_table,
		' ', @where_clause,
		@order_by,
		_limit) as 'cmd'
    from breakdown_datasets
    where name = _dataset
  );

#  select @cmd;

  PREPARE stmt FROM @cmd;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

end //
delimiter ;
