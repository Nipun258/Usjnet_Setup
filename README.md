# WiFi Network Detector

A web application to detect and manage WiFi networks using netsh commands. This application provides a user-friendly interface for scanning available networks, managing WiFi profiles, and configuring specific network profiles like USJNet.

## Features

- Scan for available WiFi networks
- View and manage saved WiFi profiles
- Configure USJNet profile
- View currently connected network
- Real-time network status updates

## Prerequisites

- Node.js (v14 or higher)
- Windows operating system (for netsh commands)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Run the development server:
```bash
npm run dev
```

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the contents of the `dist` folder to your hosting platform
3. Install production dependencies:
   ```bash
   npm install --production
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

- `PORT`: Server port (default: 3000)

## License

MIT