head -1 summer.tsv | sed "s/^/Season	/" > olympic_medals.tsv
tail -n +2 summer.tsv | sed "s/^/summer	/" >> olympic_medals.tsv
tail -n +2 winter.tsv | sed "s/^/winter	/" >> olympic_medals.tsv
head olympic_medals.tsv
