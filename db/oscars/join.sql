create index idx_osc1  on oscars_fact(film);
create index idx_mov1 on cmovies_fact(original_title);

select count(*)
from oscars_fact;

select count(*)
from oscars_fact as osc
join cmovies_fact as mov on mov.original_title = osc.film
;
