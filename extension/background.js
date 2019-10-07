chrome.downloads.onChanged.addListener(function(delta) {
    if (!delta.state ||
      (delta.state.current != 'complete')) {
      return;
    }

    //
    // Unfortunately, you can't restrict the chrome.downloads API to a specific website.
    // This code will fire on every download from every site.
    // So we check for a specific url before doing anything.
    // And the only thing we do is pop up a new tab.  The user does the rest herself.
    //
    chrome.downloads.search({orderBy:['-startTime']}, function(results){
      //
      // Find the most recent download.
      //
      var maxDate = '';
      var finalUrl = results[0].finalUrl;

      var isPersonalCapital = finalUrl.indexOf("data:text/csv;charset=utf-8,Date%2CAccount%2CDescription%2CCategory") == 0;
      var isMint = finalUrl.indexOf('https://mint.intuit.com/transactionDownload.event') == 0;

      // var link = 'http://localhost/projects/breakdown/breakdown/index.html';
      var link = 'https://dprhcp006.doteasy.com/~johndimm/breakdown/index.html';

      if (isPersonalCapital)
          link += '?dataset=personal_capital';
      if (isMint)
          link +=  '?dataset=mint';

       if (isPersonalCapital || isMint) {
        //
        // The user downloaded transactions from Mint or Personal Capital.  Time to pop up a new tab
        // for Breakdown.
        //
        chrome.tabs.create({"url": link});
      }
    });
});
