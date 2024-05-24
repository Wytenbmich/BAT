document.addEventListener('DOMContentLoaded', function() {
  displayMappings();

  const tablinks = document.getElementsByClassName('tablink');
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].addEventListener('click', function(event) {
      openTab(event, this.getAttribute('data-tab'));
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

  document.getElementById('importCSV').addEventListener('click', () => {
    const csvText = document.getElementById('csvTextarea').value.trim();
    if (csvText) {
      const lines = csvText.split('\n');
      chrome.storage.sync.get({ customMappings: {} }, data => {
        const customMappings = data.customMappings;
        lines.forEach(line => {
          const [address, service, name] = line.split(',');
          if (address && (service || name)) {
            const formattedName = service && name ? `${service.trim()}: ${name.trim()}` : service.trim() || name.trim();
            customMappings[address.trim().toLowerCase()] = formattedName;
          }
        });
        chrome.storage.sync.set({ customMappings: customMappings }, () => {
          document.getElementById('status').textContent = 'Mappings imported!';
          setTimeout(() => { document.getElementById('status').textContent = ''; }, 2000);
          displayMappings(); // Refresh the list
        });
      });
    }
  });

  document.getElementById('exportCSV').addEventListener('click', () => {
    chrome.storage.sync.get({ customMappings: {} }, data => {
      const customMappings = data.customMappings;
      let csvContent = '';
      for (const address in customMappings) {
        if (customMappings.hasOwnProperty(address)) {
          const [service, name] = customMappings[address].split(': ');
          csvContent += `${address},${service || ''},${name || ''}\n`;
        }
      }
      document.getElementById('csvTextarea').value = csvContent;
    });
  });

  // Default open tab
  document.querySelector('.tablink[data-tab="AddressBook"]').click();
});

function displayMappings() {
  chrome.storage.sync.get({ customMappings: {} }, data => {
    const mappingsList = document.getElementById('mappingsList');
    mappingsList.innerHTML = ''; // Clear current list

    for (const address in data.customMappings) {
      if (data.customMappings.hasOwnProperty(address)) {
        const mapping = data.customMappings[address];
        const [service, name] = mapping.split(': ');

        const listItem = document.createElement('div');
        listItem.classList.add('mapping-item');
        listItem.innerHTML = `
          <div>
            <strong>Address:</strong> ${address}<br>
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

function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  const tablinks = document.getElementsByClassName("tablink");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}
