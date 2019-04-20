import json

import sys
reload(sys)
sys.setdefaultencoding('utf8')

header = []
maxWidth = []
uniques = []
isInt = []

def allNumbers(inputString):
     return all(char.isdigit() for char in inputString)

def analyzeLine(line):
     cols = line.split("\t")
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
      if isInt[i]:
          types.append('int')
      else:
          types.append("varchar(%s)" % maxWidth[i])


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

  print "load data local infile '%s' into table %s;\n" % (filename, fact_table)

  print "create table %s as select " % summary_table

  dimensions = []
  for i in range(len(header)):
     if len(uniques[i]) < 1000 and types[i] != 'int':
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
