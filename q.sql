select original_title 
from cmovies_fact
where original_language = 'en' AND spoken_languages = 'Pусский' AND genres = 'Horror'
;
