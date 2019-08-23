(function() {
    var downloadBegun = false;
    const tabStorage = {};

    const networkFilters = {
        urls: [
          "https://mint.intuit.com/*"
        ]
    };

    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId } = details;

        console.log("completed: ");
        console.log(details);

        if (downloadBegun) {

            //
            // A download was started, let's see if it's finished yet.
            //
            chrome.downloads.search({}, function(results){
              var filename = results[0].filename;
              if (filename != '') {
                //
                // This should be on a server, not localhost.
                //
                var url = 'http://localhost/projects/breakdown/app/index.html?dataset=' + filename;
                chrome.tabs.create({"url": url});
                downloadBegun = false;
              }
            });

        }

        //
        // The user started a download of Mint transactions.  Wait until the next
        // request to check if it's finished downloading.
        //
        if (details.url.indexOf("https://mint.intuit.com/transactionDownload.event") != -1) {
          downloadBegun = true;
        }

    }, networkFilters);


}());
