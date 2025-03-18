const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to get available WiFi networks
app.get('/api/networks', (req, res) => {
  exec('netsh wlan show networks mode=Bssid', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return res.status(500).json({ error: 'Failed to retrieve network information' });
    }
    
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return res.status(500).json({ error: 'Error in command execution' });
    }
    
    // Parse the output to extract network information
    const networks = parseNetworkInfo(stdout);
    res.json({ networks });
  });
});

// API endpoint to get saved WiFi profiles
app.get('/api/profiles', (req, res) => {
  exec('netsh wlan show profile', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return res.status(500).json({ error: 'Failed to retrieve profile information' });
    }
    
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return res.status(500).json({ error: 'Error in command execution' });
    }
    
    // Parse the output to extract profile information
    const profiles = parseProfileInfo(stdout);
    res.json({ profiles });
  });
});

// API endpoint to delete a WiFi profile
app.delete('/api/profiles/:profileName', (req, res) => {
  const profileName = req.params.profileName;
  
  exec(`netsh wlan delete profile name="${profileName}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return res.status(500).json({ error: 'Failed to delete profile' });
    }
    
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return res.status(500).json({ error: 'Error in command execution' });
    }
    
    res.json({ message: `Profile ${profileName} deleted successfully` });
  });
});

// API endpoint to get profile details
app.get('/api/profiles/:profileName/details', (req, res) => {
  const profileName = req.params.profileName;
  
  exec(`netsh wlan show profile name="${profileName}" key=clear`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return res.status(500).json({ error: 'Failed to retrieve profile details' });
    }
    
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return res.status(500).json({ error: 'Error in command execution' });
    }
    
    // Parse the output to extract profile details
    const details = {
      authentication: stdout.match(/Authentication\s+: (.+)/)?.[1]?.trim() || 'Unknown',
      encryption: stdout.match(/Cipher\s+: (.+)/)?.[1]?.trim() || 'Unknown',
      connectionType: stdout.match(/Connection type\s+: (.+)/)?.[1]?.trim() || 'Unknown',
      radioType: stdout.match(/Radio type\s+: (.+)/)?.[1]?.trim() || 'Unknown'
    };
    
    res.json(details);
  });
});

// Function to parse network information from netsh output
function parseNetworkInfo(output) {
  const networks = [];
  const sections = output.split('SSID ');
  
  // Skip the first section as it's just the header
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const ssidMatch = section.match(/\d+ : (.+)/);
    
    if (ssidMatch) {
      const ssid = ssidMatch[1].trim();
      const signalMatch = section.match(/Signal\s+: (\d+)%/);
      const securityMatch = section.match(/Authentication\s+: (.+)/);
      const encryptionMatch = section.match(/Encryption\s+: (.+)/);
      
      networks.push({
        ssid,
        signal: signalMatch ? signalMatch[1] : 'Unknown',
        security: securityMatch ? securityMatch[1].trim() : 'Unknown',
        encryption: encryptionMatch ? encryptionMatch[1].trim() : 'Unknown'
      });
    }
  }
  
  return networks;
}

// Function to parse profile information from netsh output
function parseProfileInfo(output) {
  const profiles = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const match = line.match(/All User Profile\s+: (.+)/);
    if (match) {
      profiles.push(match[1].trim());
    }
  }
  
  return profiles;
}

// API endpoint to configure USJNet profile
app.post('/api/profiles/usjnet/configure', (req, res) => {
  const xmlPath = 'public/exports/USJNet.xml';
  
  // First delete existing profile if it exists
  exec('netsh wlan delete profile name="USJNet"', (error) => {
    if (error) {
      console.error(`Error deleting profile: ${error}`);
      // Continue even if delete fails (profile might not exist)
    }
    
    // Add the new profile using the XML file
    exec(`netsh wlan add profile filename="${xmlPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error adding profile: ${error}`);
        return res.status(500).json({ error: 'Failed to configure USJNet profile' });
      }
      
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
        return res.status(500).json({ error: 'Error in command execution' });
      }
      
      res.json({ message: 'USJNet profile configured successfully' });
    });
  });
});

// API endpoint to get currently connected WiFi network
app.get('/api/networks/connected', (req, res) => {
  exec('netsh wlan show interfaces', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return res.status(500).json({ error: 'Failed to retrieve connected network information' });
    }
    
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return res.status(500).json({ error: 'Error in command execution' });
    }
    
    // Parse the output to extract connected network information
    const ssidMatch = stdout.match(/SSID\s+: (.+)/)
    const signalMatch = stdout.match(/Signal\s+: (\d+)%/);
    const authMatch = stdout.match(/Authentication\s+: (.+)/)
    const encryptionMatch = stdout.match(/Cipher\s+: (.+)/)
    const stateMatch = stdout.match(/State\s+: (.+)/)
    
    if (!ssidMatch) {
      return res.json({ connected: false });
    }
    
    const networkInfo = {
      connected: true,
      ssid: ssidMatch[1].trim(),
      signal: signalMatch ? parseInt(signalMatch[1]) : 0,
      security: authMatch ? authMatch[1].trim() : 'Unknown',
      encryption: encryptionMatch ? encryptionMatch[1].trim() : 'Unknown',
      state: stateMatch ? stateMatch[1].trim() : 'Unknown'
    };
    
    res.json(networkInfo);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});