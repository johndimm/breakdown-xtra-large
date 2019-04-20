while (my $buf = <>) {
  print "count buf=$buf\n";
  my @cols = split("\t", $buf);
  print $#cols, "\n";
}

