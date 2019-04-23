python fix_quotes.py movies_metadata.tsv > mm2.tsv 
python p.py mm2.tsv > cmovies.tsv
python analyze.py cmovies.tsv > cmovies.sql
mysql --local-infile < cmovies.sql
