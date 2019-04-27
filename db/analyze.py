import json

import sys
reload(sys)
sys.setdefaultencoding('utf8')

header = []
maxWidth = []
uniques = []
isInt = []

def allNumbers(inputString):
     return inputString is None or all(char.isdigit() or char == '.' or char == '-' for char in inputString)

def analyzeLine(line):
     cols = line.split("\t")
#     if len(cols) != 24:
#        print len(cols)
     for col in cols:
         maxWidth.append(0)
         uniques.append(dict())
         isInt.append(True)

     i = 0
     for col in cols:
         maxWidth[i] = max(maxWidth[i], len(col))
         uniques[i][col] = 1
         if not allNumbers(col):
             isInt[i] = False;
         i += 1


def main():
  filename = sys.argv[1]
  fn = open (filename)

  line = fn.readline().rstrip()
#  print line

  header = line.split("\t")

  for line in fn:
     analyzeLine(line.rstrip())
  fn.close()

  types = []

  for i in range(len(header)):
      if (isInt[i] or header[i].find('quantity') != -1) and header[i].find('date') == -1 and header[i].find('match')  == -1:
          types.append('int')
      else:
          types.append("varchar(%s)" % maxWidth[i])

  # Print stats.
  print "/*---------"
  for i in range(len(header)):
    print "%s : %s" % (header[i], len(uniques[i]))

  measures = ['count']
  dimensions = []
  aggregates = ['count(*) as count']
  for i in range(len(header)):
    if types[i] == 'int':
       measures.append(header[i])
       aggregates.append("sum(%s) as %s" % (header[i],header[i]))
    elif len(uniques[i]) < 2000:
       dimensions.append(header[i])

  print "\n, '" + ",".join(dimensions) + "'"
  print "\n, '" + ",".join(measures) + "'"
  print "\n. '" + ",".join(aggregates) + "'"


  print "------------*/\n"
     

  # Print table create for fact table.
  base_name = filename.replace(".tsv", "")
  fact_table = "%s_fact" % base_name
  summary_table = "%s_summary" % base_name

  print "drop table if exists %s;" % fact_table
  print "drop table if exists %s;" % summary_table

  print "create table %s (" % fact_table

  fields = []
  for i in range(len(header)):
      fields.append("%s    %s" % (header[i], types[i]))

  print ",\n".join(fields);
  print ");\n\n"

  print "load data local infile '%s' into table %s ignore 1 lines;\n" % (filename, fact_table)

  print "create table %s as select " % summary_table

  dimensions = []
  for i in range(len(header)):
     if len(uniques[i]) < 2000 and types[i] != 'int':
          dimensions.append("%s" % (header[i]))

  measures = []
  measures.append("count(*) as count")
  for i in range(len(header)):
      if types[i] == 'int':
          measures.append("sum(%s) as %s" % (header[i], header[i]))

  print ",\n".join(dimensions)
  print ","
  print ",\n".join(measures)
  print "from %s" % fact_table

  print " group by "
  print ",\n".join(dimensions)
  print ";"


main();
