my $i = 0;

while (my $buf = <>) {
  chomp $buf;
#  print "\nBEFORE:", $buf;
  while ($buf =~ s/"([\[\{].+?[\]\}])"/__INSERT__/m) {
      my $json = $1;
#      print "json: $json\n";
      $json =~ s/,/\t/g;  
      my $names = getNames($json);
      $buf =~ s/__INSERT__/$names/;
  }
#  print "\nAFTER:", $buf;
  print $buf, "\n";
  exit if ++$i >20 ;
}

sub getNames {
  my ($json) = @_;
  my @names;
  while ($json =~ s/'name': '(.*?)'//) {
    push(@names, $1);
  }
  my $nameStr = join(" ", @names);
#  print "getNames, json: $json, names: $nameStr \n";
  return $nameStr;
}

