# ./make_combined.sh
# python ../analyze.py olympic_medals.tsv > olympic_medals.sql
mysql < olympic_medals.sql
# mysql < dictionary.sql
./setup.sh
