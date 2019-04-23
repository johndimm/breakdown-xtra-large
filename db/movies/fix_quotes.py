import sys

def main():
  fn = open (sys.argv[1])
  s = fn.readline().rstrip()
  print s 

  htabs = s.count('\t')

  while True:
     line = fn.readline()
     if not line:
        break

     line = line.rstrip()
     sys.stdout.write(line)

     ltabs  = line.count('\t')
     while ltabs < htabs:
        line = fn.readline().rstrip()
        ltabs += line.count('\t') 
        sys.stdout.write(line)

     print ""
        
main()          


