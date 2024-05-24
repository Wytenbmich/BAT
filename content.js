let originalTexts = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "revertChanges") {
    revertChanges();
  }
});

function translateAddresses() {
  chrome.storage.sync.get({ extensionEnabled: true }, data => {
    if (!data.extensionEnabled) return;

    const regex = /0x[a-fA-F0-9]{40}/g; // Regular expression to match Ethereum addresses

    // Collect all unique addresses on the page
    const addresses = new Set();
    const elementsWithTarget = document.querySelectorAll("span[data-highlight-target]");
    elementsWithTarget.forEach(element => {
      const fullAddress = element.getAttribute("data-highlight-target");
      if (fullAddress.match(regex)) {
        addresses.add(fullAddress);
        originalTexts.set(element, element.innerHTML); // Save original text
      }
    });

    const elements = document.body.getElementsByTagName("*");
    for (let element of elements) {
      if (element.children.length === 0) { // Skip elements with children
        const matchedAddresses = element.innerHTML.match(regex);
        if (matchedAddresses) {
          matchedAddresses.forEach(address => {
            addresses.add(address);
            originalTexts.set(element, element.innerHTML); // Save original text
          });
        }
      }
    }

    // Fetch service names for all collected addresses
    if (addresses.size > 0) {
      chrome.runtime.sendMessage(
        { action: "fetchServiceName", addresses: Array.from(addresses) },
        response => {
          if (response.serviceNames) {
            const addressMap = new Map(Array.from(addresses).map((address, index) => [address, response.serviceNames[index]]));
            // Update the elements with service names
            elementsWithTarget.forEach(element => {
              const fullAddress = element.getAttribute("data-highlight-target");
              if (addressMap.has(fullAddress) && addressMap.get(fullAddress) !== null) {
                element.innerHTML = addressMap.get(fullAddress);
              }
            });
            for (let element of elements) {
              if (element.children.length === 0) { // Skip elements with children
                const matchedAddresses = element.innerHTML.match(regex);
                if (matchedAddresses) {
                  matchedAddresses.forEach(address => {
                    if (addressMap.has(address) && addressMap.get(address) !== null) {
                      element.innerHTML = element.innerHTML.replace(address, addressMap.get(address));
                    }
                  });
                }
              }
            }
          }
        }
      );
    }
  });
}

function revertChanges() {
  originalTexts.forEach((originalText, element) => {
    element.innerHTML = originalText;
  });
  originalTexts.clear();
}

translateAddresses();
