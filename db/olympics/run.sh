./make_combined.sh
# python ../analyze.py olympic_medals.tsv > olympics.sql
mysql < dictionary.sql
mysql < olympics.sql
