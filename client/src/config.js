// Configure API URL for different environments
// - For local development on same device: 'http://localhost:5000'
// - For devices on same network: use your computer's IP address
// - For production: use your deployed server URL

// You can use window.location.hostname to dynamically get the current host
const hostname = window.location.hostname;

// If accessed from another device, use the hostname, otherwise fallback to localhost
export const API_BASE_URL = 
  hostname === 'localhost' || hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : `http://${hostname}:5000`;

// For manual configuration, uncomment and set your network IP:
// export const API_BASE_URL = 'http://192.168.1.X:5000'; // Replace X with your actual IP 