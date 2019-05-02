# breakdown

Breakdown is a tool for slicing and dicing data.   It shows the distribution of a subset of data over a given dimension according to a series of measures or metrics, where the subset is defined by selecting values for other dimensions, but it feels simpler than that.

- click on a dimension to open it up and see what's inside
- click on a dimension value to select it and restrict further results to that value
- the interactive report functions as its own query generator 
- each click generates a new report
- every choice you make as a user is supported by metrics
- no empty pages -- every link produces data

Under the hood

- react/php/mysql
- database access is restricted
  - nothing but stored procedures
  - prepared statements with parameter replacement
  - javascript browser fetch with POST
- works with data organized as dimensions and measures
  - dimensions are usually strings with cardinality under 1000 or so
  - measures are usually numbers that can be aggregated in some way


The online demo with olympic medals and oscars:

  [breakdown](http://35.231.58.42/breakdown/app/)

Video demo:

[![breakdown](https://img.youtube.com/vi/LrwngntoQAM/0.jpg)](https://youtu.be/LrwngntoQAM)
