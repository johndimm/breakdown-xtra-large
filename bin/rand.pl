while (my $buf = <>) {
  my @cols = split('","', $buf);
  # print $cols[3], "\n";
  if ($cols[3] =~ /\d/) {
    # $cols[3] = printf("%.2f", $cols[3] * rand() * 100);
    my $v =  $cols[3] * rand() * 100;
    # my $v = $cols[3];
    $cols[3] = sprintf("%.2f", $v);
  }
  my $output = join('","', @cols);
  print $output;
}

