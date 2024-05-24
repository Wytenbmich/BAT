document.getElementById('addMapping').addEventListener('click', () => {
  const address = document.getElementById('address').value.trim().toLowerCase();
  const service = document.getElementById('service').value.trim();
  const name = document.getElementById('name').value.trim();

  if (address && (service || name)) {
    const formattedName = service && name ? `${service}: ${name}` : service || name;
    chrome.storage.sync.get({ customMappings: {} }, data => {
      const customMappings = data.customMappings;
      customMappings[address] = formattedName;
      chrome.storage.sync.set({ customMappings: customMappings }, () => {
        document.getElementById('status').textContent = 'Mapping added!';
        setTimeout(() => { document.getElementById('status').textContent = ''; }, 2000);
      });
    });
  } else {
    document.getElementById('status').textContent = 'Please enter a valid address and at least one of service or name.';
    setTimeout(() => { document.getElementById('status').textContent = ''; }, 2000);
  }
});

document.getElementById('toggleExtension').addEventListener('change', event => {
  const enabled = event.target.checked;
  chrome.storage.sync.set({ extensionEnabled: enabled }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.reload(tabs[0].id);
    });
  });
});

// Set the initial state of the toggle button
chrome.storage.sync.get({ extensionEnabled: true }, data => {
  document.getElementById('toggleExtension').checked = data.extensionEnabled;
});

