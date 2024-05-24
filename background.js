// Function to fetch data from local API
function fetchFromAPI(addresses, callback) {
  const apiUrl = `http://localhost:3008/contracts/${addresses.join(',')}`;
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => callback(data))
    .catch(error => console.error('Error fetching from API:', error));
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchServiceName") {
    const addresses = message.addresses.map(addr => addr.toLowerCase());
    chrome.storage.sync.get({ customMappings: {} }, data => {
      const customMappings = data.customMappings;
      const addressesToFetch = [];
      const serviceNames = addresses.map(address => {
        if (customMappings[address]) {
          return customMappings[address];
        } else {
          addressesToFetch.push(address);
          return null; // Placeholder for API fetch
        }
      });

      if (addressesToFetch.length > 0) {
        fetchFromAPI(addressesToFetch, apiData => {
          addressesToFetch.forEach(address => {
            const index = addresses.indexOf(address);
            if (apiData[address]) {
              const service = apiData[address].service || '';
              const name = apiData[address].name || '';
              const formattedName = service && name ? `${service}: ${name}` : service || name || null;
              serviceNames[index] = formattedName;
            } else {
              serviceNames[index] = null;
            }
          });
          sendResponse({ serviceNames: serviceNames });
        });
      } else {
        sendResponse({ serviceNames: serviceNames });
      }
    });
    return true; // Keeps the message channel open for sendResponse
  }
});
