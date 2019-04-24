head -1 summer.tsv | sed "s/^/Season	/" > olympics.tsv
tail -n +2 summer.tsv | sed "s/^/summer	/" >> olympics.tsv
tail -n +2 winter.tsv | sed "s/^/winter	/" >> olympics.tsv
head olympics.tsv
