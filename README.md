# breakdown

Breakdown is a tool for slicing and dicing data.   It shows the distribution of a subset of data over a given dimension according to a series of measures or metrics, where the subset is defined by selecting values for other dimensions.  It feels simpler than that.

- click on a dimension to open it up and see what's inside
- click on a dimension value to select it and restrict further results to that value
- the interactive report functions as its own query generator 
  - each click generates a new report
- no empty pages -- every link produces data
- database access is restricted
  - nothing but stored procedures
  - prepared statements with parameter replacement
  - javascript browser fetch with POST
- works with data organized as dimensions and measures
  - dimensions are features with cardinality under 1000 or so
  - measures are numbers that can be aggregated in some way
- uses a fact table and a derived summary table
- concise code
  - 733 lines of React
  - 29 lines of html
  - 159 lines of php
  - 156 lines of mysql stored procedures


The app:

  [breakdown](http://35.231.58.42/breakdown/app/)

Video demo:

[![breakdown](https://img.youtube.com/vi/TbkgVzR4pUM/0.jpg)](https://youtu.be/TbkgVzR4pUM)
