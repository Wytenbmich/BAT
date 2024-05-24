function displayMappings() {
  chrome.storage.sync.get({ customMappings: {} }, data => {
    const mappingsList = document.getElementById('mappingsList');
    mappingsList.innerHTML = ''; // Clear current list

    for (const address in data.customMappings) {
      if (data.customMappings.hasOwnProperty(address)) {
        const mapping = data.customMappings[address];
        const [service, name] = mapping.split(': ');

        const truncatedAddress = address.length > 10 ? `${address.slice(0, 5)}...${address.slice(-5)}` : address;

        const listItem = document.createElement('div');
        listItem.classList.add('mapping-item');
        listItem.innerHTML = `
          <div>
            <strong>Address:</strong> ${truncatedAddress}<br>
            <strong>Service:</strong> ${service || ''}<br>
            <strong>Name:</strong> ${name || ''}
          </div>
          <div class="actions">
            <img src="icons/edit-icon.png" class="edit-icon" data-address="${address}" alt="Edit">
            <img src="icons/remove-icon.png" class="remove-icon" data-address="${address}" alt="Remove">
          </div>
        `;

        mappingsList.appendChild(listItem);
      }
    }

    // Add event listeners to edit and remove buttons
    document.querySelectorAll('.edit-icon').forEach(icon => {
      icon.addEventListener('click', event => {
        const address = event.target.getAttribute('data-address');
        editMapping(address);
      });
    });

    document.querySelectorAll('.remove-icon').forEach(icon => {
      icon.addEventListener('click', event => {
        const address = event.target.getAttribute('data-address');
        removeMapping(address);
      });
    });
  });
}


function editMapping(address) {
  chrome.storage.sync.get({ customMappings: {} }, data => {
    const mapping = data.customMappings[address];
    const [service, name] = mapping.split(': ');

    document.getElementById('address').value = address;
    document.getElementById('service').value = service || '';
    document.getElementById('name').value = name || '';
  });
}

function removeMapping(address) {
  chrome.storage.sync.get({ customMappings: {} }, data => {
    const customMappings = data.customMappings;
    delete customMappings[address];
    chrome.storage.sync.set({ customMappings: customMappings }, () => {
      displayMappings(); // Refresh the list
      document.getElementById('status').textContent = 'Mapping removed!';
      setTimeout(() => { document.getElementById('status').textContent = ''; }, 2000);
    });
  });
}

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
        displayMappings(); // Refresh the list
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

// Initial display of mappings
displayMappings();
