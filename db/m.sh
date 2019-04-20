python analyze.py cmovies.tsv > cmovies.sql
mysql --local-infile < cmovies.sql
