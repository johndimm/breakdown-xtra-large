chrome.downloads.onChanged.addListener(function(delta) {
    if (!delta.state ||
      (delta.state.current != 'complete')) {
      return;
    }

    chrome.downloads.search({}, function(results){
      var filename = results[0].filename;
      if (filename.includes("transactions")) {
        //
        // The user downloaded transactions from Mint.  Time to pop up a new tab
        // for Breakdown.
        //
        var url = 'https://dprhcp006.doteasy.com/~johndimm/breakdown/index.html?dataset=' + filename;
        // var url = 'http://localhost/projects/breakdown/breakdown/index.html?dataset=' + filename;
        chrome.tabs.create({"url": url});
      }
    });

});
