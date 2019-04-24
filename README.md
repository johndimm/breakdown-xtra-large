# breakdown

Breakdown is a tool for slicing and dicing data, sometimes called a "cube viewer".  

- the interactive report functions as its own query generator 
- no empty pages -- every link produces data
- database access
  - stored procedures
  - prepared statements with parameter replacement
  - javascript uses browser fetch with POST
- works with data organized as dimensions and measures
  - dimensions are mostly strings, features with cardinality under 1000 or so
  - measures are numbers that can be aggregated in some way
- uses a fact table (details) and a summary table (or view, for small fact tables)
- concise code
  - 733 lines of React
  - 29 lines of html
  - 159 lines of php
  - 156 lines of mysql stored procedures


The app:

  [breakdown](http://35.231.58.42/breakdown/app/)

Video demo:

[![breakdown](https://img.youtube.com/vi/AJ-zmZ_7q50/0.jpg)](https://www.youtube.com/watch?v=AJ-zmZ_7q50)
