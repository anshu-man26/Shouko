# Spotify Integration Setup Guide

This guide will help you set up Spotify integration for your Shouko application.

## Prerequisites

1. A Spotify account
2. Access to the Spotify Developer Dashboard

## Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the following details:
   - **App name**: `Shouko Music Player` (or any name you prefer)
   - **App description**: `Music player integration for Shouko case management system`
   - **Website**: `http://localhost:5173` (for development)
   - **Redirect URIs**: `http://localhost:5173/spotify-callback`
   - **API/SDKs**: Select "Web API"
5. Click "Save"

## Step 2: Get Your Client ID

1. After creating the app, you'll be redirected to the app dashboard
2. Copy the **Client ID** from the app overview
3. Keep this Client ID safe - you'll need it for the next step

## Step 3: Configure Environment Variables (Recommended)

1. Create a `.env` file in the `client` directory
2. Add the following content:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/spotify-callback
   ```
3. Replace `your_spotify_client_id_here` with your actual Client ID from Step 2
4. Save the file

**Note**: The `.env` file should be added to your `.gitignore` to keep your Client ID secure.

### Alternative: Direct Code Update

If you prefer to update the code directly:

1. Open `client/src/components/SpotifyPlayer.jsx`
2. Find this line:
   ```javascript
   const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID';
   ```
3. Replace `'YOUR_SPOTIFY_CLIENT_ID'` with your actual Client ID from Step 2
4. Save the file

## Step 4: Configure Redirect URIs for Production

When you deploy your application to production, you'll need to:

1. Go back to your Spotify app dashboard
2. Add your production domain to the Redirect URIs
3. Update your environment variables

For example, if your production URL is `https://yourdomain.com`:

**In your Spotify app dashboard:**
- Add `https://yourdomain.com/spotify-callback` to Redirect URIs

**In your production environment:**
- Set `VITE_SPOTIFY_REDIRECT_URI=https://yourdomain.com/spotify-callback`

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your application
3. Look for the "Connect Spotify" button in the top bar
4. Click it to authenticate with Spotify
5. You should be redirected to Spotify's authorization page
6. After authorizing, you'll be redirected back to your app
7. The Spotify player should now be visible and functional

## Features

The Spotify integration includes:

- **Authentication**: Secure OAuth 2.0 login with Spotify
- **Current Track Display**: Shows currently playing track with artwork
- **Playback Controls**: Play/pause, skip to next/previous track
- **Volume Control**: Adjust playback volume
- **Progress Bar**: Real-time track progress
- **User Profile**: Display connected user's profile
- **Responsive Design**: Works on desktop and mobile devices

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Make sure the redirect URI in your Spotify app matches exactly
   - Check for trailing slashes or protocol mismatches

2. **"Client ID not found" error**
   - Verify you've replaced the placeholder Client ID with your actual one
   - Check for typos in the Client ID

3. **"Access token expired" error**
   - The access token will automatically refresh
   - If issues persist, try logging out and back in

4. **No music controls working**
   - Make sure you have Spotify Premium (required for playback control)
   - Ensure you have an active Spotify session on another device
   - Check that your browser allows popups/redirects

### Development vs Production

- **Development**: Use `http://localhost:5173/spotify-callback`
- **Production**: Use `https://yourdomain.com/spotify-callback`

## Security Notes

- Never commit your Client ID to version control
- Consider using environment variables for production
- The access token is stored in localStorage (consider more secure storage for production)

## API Permissions

The integration requests the following Spotify permissions:

- `user-read-private`: Read user's profile
- `user-read-email`: Read user's email
- `user-read-playback-state`: Read current playback state
- `user-modify-playback-state`: Control playback
- `user-read-currently-playing`: Read currently playing track
- `streaming`: Control playback on user's devices
- `user-read-recently-played`: Read recently played tracks
- `user-read-playback-position`: Read playback position
- `user-top-read`: Read user's top tracks/artists

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your Spotify app configuration
3. Ensure you have the required Spotify Premium subscription
4. Check that all dependencies are properly installed

## Dependencies

The integration uses:
- `spotify-web-api-js`: Official Spotify Web API wrapper
- `react-icons`: For UI icons
- `react-hot-toast`: For notifications

Make sure these are installed:
```bash
npm install spotify-web-api-js react-icons react-hot-toast
``` 