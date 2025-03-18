document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const scanBtn = document.getElementById('scan-btn');
  const profilesBtn = document.getElementById('profiles-btn');
  const loadingIndicator = document.getElementById('loading');
  const networksContainer = document.getElementById('networks-container');
  const profilesContainer = document.getElementById('profiles-container');
  const networksList = document.getElementById('networks-list');
  const profilesList = document.getElementById('profiles-list');
  
  // Event Listeners
  scanBtn.addEventListener('click', scanNetworks);
  profilesBtn.addEventListener('click', showProfiles);
  
  // Function to scan for available networks
  async function scanNetworks() {
    try {
      // Show loading indicator
      loadingIndicator.style.display = 'flex';
      loadingIndicator.querySelector('p').textContent = 'Scanning for networks...';
      
      // Show networks container, hide profiles container
      networksContainer.classList.remove('hidden');
      profilesContainer.classList.add('hidden');
      
      // Clear previous results
      networksList.innerHTML = '';
      
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
        data.networks.forEach(network => {
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
          `;
          
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
      
      // Show profiles container, hide networks container
      profilesContainer.classList.remove('hidden');
      networksContainer.classList.add('hidden');
      
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
  
  // Function to show profile details
  async function showProfileDetails(profileName) {
    const detailsContainer = document.getElementById(`details-${profileName}`);
    
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
  async function deleteProfile(profileName) {
    if (!confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(profileName)}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete profile');
      }
      
      // Refresh profiles list
      showProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert(error.message || 'Failed to delete profile');
    }
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
  
  // Automatically scan for networks when the page loads
  scanNetworks();
});