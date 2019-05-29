sub  trim { my $s = shift; $s =~ s/^\s+|\s+$//g; return $s };

$nCols = 4;
while ($buf = <>) {
  $buf = trim($buf);
  $nCols--;
  $buf =~ s/^\$(\d+) M$/\1/;
  print $buf;
  if ($nCols == 0) {
    $nCols = 4;
    print "\n";  
  } else {
    print "\t";
  }
}

