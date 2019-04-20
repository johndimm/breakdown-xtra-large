import json

import sys
reload(sys)
sys.setdefaultencoding('utf8')

def printCol(c):
  col = c.replace("'", '"')
  output = []

  try:
     y = json.loads(col)
     output.append(y['name'])
  except:
     try:
        for subobj in y:
            output.append(subobj['name'])
            break

     except:
        output.append(col)
  column = ', '.join(output)
  c = "%s\t" % column
  sys.stdout.write(c)

def printLine(line):
     cols = line.split("\t")
     for col in cols:
       printCol(col)

def main():
  fn = open ('movies.tsv')
  for line in fn:
     printLine(line.rstrip())
     print ("")
  fn.close()

main();

