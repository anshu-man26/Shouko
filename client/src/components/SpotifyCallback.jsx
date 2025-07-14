import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '714d612377df435ea95f6688ef22d072';
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'https://f28e70b9e4d6.ngrok-free.app/spotify-callback';

const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Spotify callback URL:', window.location.href);
      
      // Check for error in URL
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      const accessToken = hashParams.get('access_token');
      const code = urlParams.get('code');

      console.log('Error:', error);
      console.log('Error description:', errorDescription);
      console.log('Access token:', accessToken ? 'Present' : 'Not present');
      console.log('Code:', code ? 'Present' : 'Not present');

      if (error) {
        console.error('Spotify auth error:', error, errorDescription);
        
        if (error === 'invalid_client') {
          toast.error('Spotify Client ID not configured. Please check the setup guide.');
        } else if (error === 'access_denied') {
          toast.error('Spotify access denied. Please try again.');
        } else if (error === 'unsupported_response_type') {
          toast.error('Spotify OAuth configuration error. Please check the setup.');
        } else {
          toast.error(`Spotify authentication failed: ${errorDescription || error}`);
        }
        
        navigate('/');
        return;
      }

      if (accessToken) {
        localStorage.setItem('spotify_token', accessToken);
        toast.success('Successfully connected to Spotify!');
        navigate('/');
      } else if (code) {
        // Exchange authorization code for access token
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: REDIRECT_URI
            })
          });
          
          const data = await response.json();
          
          if (data.access_token) {
            localStorage.setItem('spotify_token', data.access_token);
            toast.success('Successfully connected to Spotify!');
            navigate('/');
          } else {
            console.error('Token exchange failed:', data);
            toast.error('Failed to get access token from Spotify');
            navigate('/');
          }
        } catch (error) {
          console.error('Token exchange error:', error);
          toast.error('Failed to connect to Spotify');
          navigate('/');
        }
      } else {
        toast.error('No access token or authorization code received');
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: 'white',
      fontSize: '18px'
    }}>
      Connecting to Spotify...
    </div>
  );
};

export default SpotifyCallback; 