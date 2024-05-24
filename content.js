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
      if (element.children.length === 0 && !element.hasAttribute('data-no-translate')) { // Skip elements with children and elements marked to skip translation
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
        { action: "fetchContractData", addresses: Array.from(addresses) },
        response => {
          if (response.contractData) {
            const addressMap = new Map(Array.from(addresses).map((address, index) => [address, response.contractData[index]]));
            const iconURL = chrome.runtime.getURL("icons/icon16.png");

            const socialIcons = {
              homepage: 'icons/homepage.png',
              github: 'icons/github.png',
              discord: 'icons/discord.png',
              twitter: 'icons/twitter.png',
              telegram: 'icons/telegram.png',
            };

            const shortenAddress = (address) => {
              return address.slice(0, 9) + '...' + address.slice(-7);
            };

            const iconAndPopup = (originalAddress, contractData) => {
              const price = contractData?.usd_price ? ` $${parseFloat(contractData.usd_price) >= 1 ? parseFloat(contractData.usd_price).toFixed(2) : parseFloat(contractData.usd_price).toPrecision(3)}<br/>` : '';

              let socialLinks = '';

              for (let key in socialIcons) {
                if (contractData[key]) {
                  socialLinks += `<a href="${contractData[key]}" target="_blank"><img src="${chrome.runtime.getURL(socialIcons[key])}" alt="${key}" style="vertical-align: middle; margin-right: 5px;"></a>`;
                }
              }

              return `
                <div class="bat-popup" style="display: inline;">
                  <img src="${iconURL}" alt="icon" style="vertical-align: middle; margin-right: 5px;">
                  <span class="popuptext">
                    ${contractData.name}<br/>
                    ${price}
                    <span class="contract-address" data-no-translate>${shortenAddress(originalAddress)}<img src="${chrome.runtime.getURL('icons/copy.png')}" alt="copy" style="vertical-align: middle; margin-left: 5px; cursor: pointer;" onclick="navigator.clipboard.writeText('${originalAddress}')"></span><br/>
                    ${socialLinks}
                  </span>
                </div>`.trim();
            };

            // Update the elements with service names
            elementsWithTarget.forEach(element => {
              const fullAddress = element.getAttribute("data-highlight-target");
              const contractData = addressMap.get(fullAddress);
              if (contractData) {
                element.innerHTML = iconAndPopup(fullAddress, contractData) + contractData.name;
              }
            });

            for (let element of elements) {
              if (element.children.length === 0 && !element.hasAttribute('data-no-translate')) { // Skip elements with children and elements marked to skip translation
                const matchedAddresses = element.innerHTML.match(regex);
                if (matchedAddresses) {
                  matchedAddresses.forEach(address => {
                    const contractData = addressMap.get(address);
                    if (contractData) {
                      element.innerHTML = element.innerHTML.replace(address, iconAndPopup(address, contractData) + element.innerHTML.replace(address, contractData.name));
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
