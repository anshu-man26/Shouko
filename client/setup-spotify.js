#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎵 Spotify Integration Setup for Shouko\n');
console.log('This script will help you configure Spotify integration.\n');

console.log('📋 Prerequisites:');
console.log('1. A Spotify account');
console.log('2. Access to Spotify Developer Dashboard (https://developer.spotify.com/dashboard)\n');

console.log('🔧 Steps to get your Client ID:');
console.log('1. Go to https://developer.spotify.com/dashboard');
console.log('2. Log in with your Spotify account');
console.log('3. Click "Create App"');
console.log('4. Fill in the app details:');
console.log('   - App name: Shouko Music Player');
console.log('   - App description: Music player integration for Shouko');
console.log('   - Website: http://localhost:5173');
console.log('   - Redirect URIs: http://localhost:5173/spotify-callback');
console.log('5. Click "Save" and copy the Client ID\n');

rl.question('Enter your Spotify Client ID: ', (clientId) => {
  if (!clientId || clientId.trim() === '') {
    console.log('❌ Client ID is required. Please run this script again with a valid Client ID.');
    rl.close();
    return;
  }

  const envContent = `# Spotify Configuration
VITE_SPOTIFY_CLIENT_ID=${clientId.trim()}
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/spotify-callback

# For production, update the redirect URI to your domain
# VITE_SPOTIFY_REDIRECT_URI=https://yourdomain.com/spotify-callback
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Successfully created .env file with your Spotify Client ID!');
    console.log('📁 File location:', envPath);
    console.log('\n🚀 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to your app');
    console.log('3. Click "Connect Spotify" in the top bar');
    console.log('4. Authorize with your Spotify account');
    console.log('\n📖 For more details, see SPOTIFY_SETUP.md');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}); 