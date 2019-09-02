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
    chrome.downloads.search({}, function(results){
      var finalUrl = results[0].finalUrl;
      if (finalUrl.indexOf('https://mint.intuit.com/transactionDownload.event') == 0) {
        //
        // The user downloaded transactions from Mint.  Time to pop up a new tab
        // for Breakdown.
        //
        var filename = results[0].filename;
        var url = 'https://dprhcp006.doteasy.com/~johndimm/breakdown/index.html?dataset=' + filename;
        // var url = 'http://localhost/projects/breakdown/breakdown/index.html?dataset=' + filename;

        chrome.tabs.create({"url": url});
      }
    });
});
