import json

import sys
reload(sys)
sys.setdefaultencoding('utf8')

def printCol(head, c):
  col = c.replace("'", '"')
  output = []

  try:
     y = json.loads(col)
     output.append(y['name'])

  except:
     try:
        for subobj in y:
            output.append(subobj['name'])
            if len(output) == 3:
                break

     except:
        output.append(col)

  sep = ', '
  if head == 'genres':
    sep = '\t'
    while len(output) < 3:
      output.append('')

  column = sep.join(output)
  c = "%s\t" % (column)
  sys.stdout.write(c)

def printLine(header, line):
     cols = line.split("\t")
     for i in range(len(cols)):
         col = cols[i]
         head = header[i]
         printCol(head, col)

def main():
  filename = sys.argv[1]
  fn = open (filename)

  topline = fn.readline().rstrip()
  header = topline.split("\t")
  topline_ex = topline.replace('\tgenres\t', '\tgenre1\tgenre2\tgenre3\t')
  print topline_ex

  for line in fn:
     printLine(header, line.rstrip())
     print ("")

  fn.close()

main();

