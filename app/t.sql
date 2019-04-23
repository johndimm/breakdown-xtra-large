
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


