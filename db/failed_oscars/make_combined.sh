head -1 actors.tsv | sed "s/^/Role	/" > oscars.tsv
tail -n +2 actors.tsv | sed "s/^/Actor	/" >> oscars.tsv
tail -n +2 actresses.tsv | sed "s/^/Actress	/" >> oscars.tsv
tail -n +2 directors.tsv | sed "s/^/Director	/" >> oscars.tsv
tail -n +2 pictures.tsv | sed "s/^/Picture	/" >> oscars.tsv
head oscars.tsv
