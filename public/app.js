document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const scanBtn = document.getElementById('scan-btn');
  const profilesBtn = document.getElementById('profiles-btn');
  const setupBtn = document.getElementById('setup-btn');
  const connectedBtn = document.getElementById('connected-btn');
  const loadingIndicator = document.getElementById('loading');
  const networksContainer = document.getElementById('networks-container');
  const profilesContainer = document.getElementById('profiles-container');
  const networksList = document.getElementById('networks-list');
  const profilesList = document.getElementById('profiles-list');
  const toastContainer = document.querySelector('.toast-container');

  // Toast notification function
  function showToast(message, type = 'success', actions = null) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    toast.appendChild(messageDiv);
    
    if (actions) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'toast-actions';
      
      Object.entries(actions).forEach(([label, callback]) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.className = 'toast-action-btn';
        button.onclick = () => {
          callback();
          toast.style.animation = 'slideIn 0.3s ease-in-out reverse';
          setTimeout(() => toast.remove(), 300);
        };
        actionsDiv.appendChild(button);
      });
      
      toast.appendChild(actionsDiv);
    } else {
      setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-in-out reverse';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
    
    toastContainer.appendChild(toast);
  }
  
  // Event Listeners
  scanBtn.addEventListener('click', () => {
    resetButtonStates();
    scanBtn.classList.remove('secondary');
    scanBtn.classList.add('primary');
    scanNetworks();
  });

  profilesBtn.addEventListener('click', () => {
    resetButtonStates();
    profilesBtn.classList.remove('secondary');
    profilesBtn.classList.add('primary');
    showProfiles();
  });

  setupBtn.addEventListener('click', () => {
    resetButtonStates();
    setupBtn.classList.remove('secondary');
    setupBtn.classList.add('primary');
    setupUSJNet();
  });

  connectedBtn.addEventListener('click', () => {
    resetButtonStates();
    connectedBtn.classList.remove('secondary');
    connectedBtn.classList.add('primary');
    showConnectedNetwork();
  });

  function resetButtonStates() {
    [scanBtn, profilesBtn, setupBtn, connectedBtn].forEach(btn => {
      btn.classList.remove('primary');
      btn.classList.add('secondary');
    });
  }

  // Show connected network on initial load
  showConnectedNetwork();
  resetButtonStates();
  connectedBtn.classList.remove('secondary');
  connectedBtn.classList.add('primary');

  // Function to show connected network
  async function showConnectedNetwork() {
    try {
      // Hide all containers
      document.querySelectorAll('.results-container > div').forEach(container => {
        container.classList.add('hidden');
      });
      // Show only connected container
      document.getElementById('connected-container').classList.remove('hidden');
      networksContainer.classList.add('hidden');
      profilesContainer.classList.add('hidden');
      
      // Show loading indicator
      loadingIndicator.style.display = 'flex';
      loadingIndicator.querySelector('p').textContent = 'Getting connected network...';
      
      // Clear previous results
      const connectedNetworkDiv = document.getElementById('connected-network');
      connectedNetworkDiv.innerHTML = '';
      
      // Fetch connected network from API
      const response = await fetch('/api/networks/connected');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve connected network');
      }
      
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Display connected network
      if (data.connected) {
        const networkItem = document.createElement('div');
        networkItem.className = 'network-item';
        
        // Create signal strength indicator
        const signalStrength = getSignalStrengthIcon(data.signal);
        
        networkItem.innerHTML = `
          <h3>${data.ssid} ${signalStrength}</h3>
          <div class="network-details">
            <span class="network-detail">Signal: ${data.signal}%</span>
            <span class="network-detail">Security: ${data.security}</span>
            <span class="network-detail">Encryption: ${data.encryption}</span>
            <span class="network-detail">State: ${data.state}</span>
          </div>
          <div class="network-actions">
            <button class="btn disconnect-btn">Disconnect</button>
          </div>
        `;

        // Add event listener for disconnect button
        const disconnectBtn = networkItem.querySelector('.disconnect-btn');
        disconnectBtn.addEventListener('click', async () => {
          try {
            loadingIndicator.style.display = 'flex';
            loadingIndicator.querySelector('p').textContent = 'Disconnecting from network...';

            const response = await fetch('/api/networks/disconnect', {
              method: 'POST'
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast(data.message, 'success');
            await showConnectedNetwork();
            await scanNetworks();
          } catch (error) {
            console.error('Error disconnecting from network:', error);
            showToast(error.message || 'Failed to disconnect from network', 'error');
          } finally {
            loadingIndicator.style.display = 'none';
          }
        });
        
        connectedNetworkDiv.appendChild(networkItem);
      } else {
        connectedNetworkDiv.innerHTML = '<p>Not connected to any network</p>';
      }
    } catch (error) {
      console.error('Error getting connected network:', error);
      loadingIndicator.style.display = 'none';
      
      // Display error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = error.message || 'Failed to get connected network';
      
      document.getElementById('connected-network').innerHTML = '';
      document.getElementById('connected-network').appendChild(errorMessage);
    }
  }
  
  // Function to scan for available networks
  async function scanNetworks() {
    try {
      // Show loading indicator
      loadingIndicator.style.display = 'flex';
      loadingIndicator.querySelector('p').textContent = 'Scanning for networks...';
      
      // Show only networks container
      document.querySelectorAll('.results-container > div').forEach(container => {
        container.classList.add('hidden');
      });
      networksContainer.classList.remove('hidden');
      
      // Clear previous results
      networksList.innerHTML = '';
      
      // Fetch connected network first
      const connectedResponse = await fetch('/api/networks/connected');
      const connectedData = await connectedResponse.json();
      const connectedSSID = connectedData.connected ? connectedData.ssid : null;
      
      // Fetch networks from API
      const response = await fetch('/api/networks');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve networks');
      }
      
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Display networks
      if (data.networks && data.networks.length > 0) {
        // Filter out the connected network
        const availableNetworks = data.networks.filter(network => network.ssid !== connectedSSID);
        
        if (availableNetworks.length === 0) {
          networksList.innerHTML = '<p>No other networks available</p>';
          return;
        }
        
        availableNetworks.forEach(network => {
          const networkItem = document.createElement('div');
          networkItem.className = 'network-item';
          
          // Create signal strength indicator
          const signalStrength = getSignalStrengthIcon(network.signal);
          
          networkItem.innerHTML = `
            <h3>${network.ssid} ${signalStrength}</h3>
            <div class="network-details">
              <span class="network-detail">Signal: ${network.signal}%</span>
              <span class="network-detail">Security: ${network.security}</span>
              <span class="network-detail">Encryption: ${network.encryption}</span>
            </div>
            <div class="network-actions">
              <button class="btn connect-btn" data-ssid="${network.ssid}">Connect</button>
            </div>
          `;

          // Add event listener for connect button
          const connectBtn = networkItem.querySelector('.connect-btn');
          connectBtn.addEventListener('click', async () => {
            try {
              loadingIndicator.style.display = 'flex';
              loadingIndicator.querySelector('p').textContent = `Connecting to ${network.ssid}...`;

              const response = await fetch('/api/networks/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ssid: network.ssid })
              });

              const data = await response.json();
              if (!response.ok) throw new Error(data.error);

              showToast(data.message, 'success');
              await showConnectedNetwork();
              await scanNetworks();
            } catch (error) {
              console.error('Error connecting to network:', error);
              showToast(error.message || 'Failed to connect to network', 'error');
            } finally {
              loadingIndicator.style.display = 'none';
            }
          });
          
          networksList.appendChild(networkItem);
        });
      } else {
        networksList.innerHTML = '<p>No networks found</p>';
      }
    } catch (error) {
      console.error('Error scanning networks:', error);
      loadingIndicator.style.display = 'none';
      
      // Display error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = error.message || 'Failed to scan networks';
      
      networksList.innerHTML = '';
      networksList.appendChild(errorMessage);
    }
  }
  
  // Function to show saved profiles
  async function showProfiles() {
    try {
      // Show loading indicator
      loadingIndicator.style.display = 'flex';
      loadingIndicator.querySelector('p').textContent = 'Loading saved profiles...';
      
      // Show only profiles container
      document.querySelectorAll('.results-container > div').forEach(container => {
        container.classList.add('hidden');
      });
      profilesContainer.classList.remove('hidden');
      
      // Clear previous results
      profilesList.innerHTML = '';
      
      // Fetch profiles from API
      const response = await fetch('/api/profiles');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve profiles');
      }
      
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Display profiles
      if (data.profiles && data.profiles.length > 0) {
        data.profiles.forEach(profile => {
          const profileItem = document.createElement('div');
          profileItem.className = 'profile-item';
          
          profileItem.innerHTML = `
            <div class="profile-header">
              <h3>${profile}</h3>
              <div class="profile-actions">
                <button class="btn details-btn" data-profile="${profile}">Details</button>
                <button class="btn delete-btn" data-profile="${profile}">Delete</button>
              </div>
            </div>
            <div class="profile-details-container" id="details-${profile}"></div>
          `;
          
          profilesList.appendChild(profileItem);
          
          // Add event listeners for details and delete buttons
          const detailsBtn = profileItem.querySelector('.details-btn');
          const deleteBtn = profileItem.querySelector('.delete-btn');
          
          detailsBtn.addEventListener('click', () => showProfileDetails(profile));
          deleteBtn.addEventListener('click', () => deleteProfile(profile));
        });
      } else {
        profilesList.innerHTML = '<p>No saved profiles found</p>';
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      loadingIndicator.style.display = 'none';
      
      // Display error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = error.message || 'Failed to load profiles';
      
      profilesList.innerHTML = '';
      profilesList.appendChild(errorMessage);
    }
  }
  
  // Function to show/hide profile details
  async function showProfileDetails(profileName) {
    const detailsContainer = document.getElementById(`details-${profileName}`);
    
    // If details are already loaded and visible, hide them
    if (detailsContainer.innerHTML && detailsContainer.style.display !== 'none') {
      detailsContainer.style.display = 'none';
      return;
    }
    
    // Show the container if it was hidden
    detailsContainer.style.display = 'block';
    
    // If details are already loaded, no need to fetch again
    if (detailsContainer.innerHTML && !detailsContainer.querySelector('.loading-details') && !detailsContainer.querySelector('.error-message')) {
      return;
    }
    
    try {
      // Show loading state
      detailsContainer.innerHTML = '<div class="loading-details">Loading details...</div>';
      
      // Fetch profile details
      const response = await fetch(`/api/profiles/${encodeURIComponent(profileName)}/details`);
      const details = await response.json();
      
      if (!response.ok) {
        throw new Error(details.error || 'Failed to retrieve profile details');
      }
      
      // Display details
      detailsContainer.innerHTML = `
        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-label">Authentication:</span>
            <span class="detail-value">${details.authentication}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Encryption:</span>
            <span class="detail-value">${details.encryption}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Connection Type:</span>
            <span class="detail-value">${details.connectionType}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Radio Type:</span>
            <span class="detail-value">${details.radioType}</span>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading profile details:', error);
      detailsContainer.innerHTML = `
        <div class="error-message">
          Failed to load profile details: ${error.message}
        </div>
      `;
    }
  }

  // Function to close modal
  function closeModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Function to delete profile
  // Function to delete profile
  async function deleteProfile(profileName) {
    showToast(`Are you sure you want to delete the profile "${profileName}"?`, 'warning', {
      'Confirm': async () => {
        try {
          const response = await fetch(`/api/profiles/${encodeURIComponent(profileName)}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete profile');
          }
          
          showToast(`Profile "${profileName}" has been deleted`, 'success');
          showProfiles();
        } catch (error) {
          console.error('Error deleting profile:', error);
          showToast(error.message || 'Failed to delete profile', 'error');
        }
      },
      'Cancel': () => {}
    });
  }
  
  // Function to generate signal strength icon based on percentage
  function getSignalStrengthIcon(signalStr) {
    const signal = parseInt(signalStr, 10);
    let bars = '';
    
    if (signal >= 80) {
      bars = '📶'; // Full signal
    } else if (signal >= 60) {
      bars = '📶'; // 3/4 signal
    } else if (signal >= 40) {
      bars = '📶'; // 2/4 signal
    } else if (signal >= 20) {
      bars = '📶'; // 1/4 signal
    } else {
      bars = '📶'; // Low signal
    }
    
    return `<span class="signal-strength" title="Signal Strength: ${signal}%">${bars}</span>`;
  }
  
  // Function to setup USJNet profile
  async function setupUSJNet() {
    try {
      // Show loading indicator
      loadingIndicator.style.display = 'flex';
      loadingIndicator.querySelector('p').textContent = 'Configuring USJNet profile...';
      
      // Configure USJNet profile
      const response = await fetch('/api/profiles/usjnet/configure', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to configure USJNet profile');
      }
      
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Show success message
      showToast('USJNet profile configured successfully!');
      
      // Refresh profiles list
      showProfiles();
    } catch (error) {
      console.error('Error configuring USJNet profile:', error);
      loadingIndicator.style.display = 'none';
      showToast(error.message || 'Failed to configure USJNet profile', 'error');
    }
  }
  
  // Networks are now scanned automatically with showConnectedNetwork
});