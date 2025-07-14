import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiMusic, FiLogIn, FiLogOut, FiHeart, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { UserContext } from '../../context/userContext';
import './SpotifyPlayer.css';
// import Modal from 'react-modal';
import Modal from 'react-modal';
import ReactDOM from 'react-dom';

const spotifyApi = new SpotifyWebApi();

const SPOTIFY_PLAYER_NAME = 'Shouko Player';

// Context for exposing controls
export const SpotifyPlayerContext = createContext();

const EqualizerBars = ({ isPlaying }) => (
  <svg width="22" height="18" viewBox="0 0 22 18" style={{marginLeft: 4}}>
    <rect x="2" y="6" width="3" height="6" rx="1.5" fill="#fff">
      <animate attributeName="height" values="6;16;6" dur="0.7s" repeatCount="indefinite" begin="0s" keyTimes="0;0.5;1" calcMode="linear" 
        {...(!isPlaying && { values: '6;6;6' })} />
    </rect>
    <rect x="8" y="2" width="3" height="14" rx="1.5" fill="#fff">
      <animate attributeName="height" values="14;6;14" dur="0.7s" repeatCount="indefinite" begin="0.2s" keyTimes="0;0.5;1" calcMode="linear" 
        {...(!isPlaying && { values: '14;14;14' })} />
    </rect>
    <rect x="14" y="4" width="3" height="10" rx="1.5" fill="#fff">
      <animate attributeName="height" values="10;16;10" dur="0.7s" repeatCount="indefinite" begin="0.4s" keyTimes="0;0.5;1" calcMode="linear" 
        {...(!isPlaying && { values: '10;10;10' })} />
    </rect>
  </svg>
);

const SpotifyPlayer = () => {
  const { user } = useContext(UserContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [player, setPlayer] = useState(null); // Spotify SDK Player instance
  const [deviceId, setDeviceId] = useState(null); // SDK device id
  const progressInterval = useRef(null);
  const sdkLoaded = useRef(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const playerInstanceRef = useRef(null); // Only one player instance
  const playerPanelRef = useRef(null);
  const likedSongsModalRef = useRef(null);
  const [showLikedSongs, setShowLikedSongs] = useState(false);
  const [likedSongs, setLikedSongs] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [likedSongsError, setLikedSongsError] = useState(null);
  const [likedSongsOffset, setLikedSongsOffset] = useState(0);
  const [hasMoreLikedSongs, setHasMoreLikedSongs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLikedSongs, setFilteredLikedSongs] = useState([]);
  const [searchingAllSongs, setSearchingAllSongs] = useState(false);
  const [allLikedSongs, setAllLikedSongs] = useState([]);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'track', 'context'

  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '714d612377df435ea95f6688ef22d072';
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'https://f28e70b9e4d6.ngrok-free.app/spotify-callback';
  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming', // Required for Web Playback SDK
    'user-read-recently-played',
    'user-read-playback-position',
    'user-top-read',
    'user-library-read', // Required for Liked Songs
    'playlist-read-private', // For recommendations
    'playlist-read-collaborative', // For recommendations
  ];

  // 1. Load Spotify Web Playback SDK script
  useEffect(() => {
    if (!window.Spotify && !sdkLoaded.current) {
      // Define the callback function before loading the script
      window.onSpotifyWebPlaybackSDKReady = () => {
        sdkLoaded.current = true;
      };
      
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.Spotify) {
      sdkLoaded.current = true;
    }
  }, []);

  // 2. On login, initialize SDK player
  useEffect(() => {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      spotifyApi.setAccessToken(token);
      setIsLoggedIn(true);
      fetchUserProfile();
      fetchCurrentTrack();
      // Wait for SDK to load
      const tryInitPlayer = () => {
        if (window.Spotify && window.Spotify.Player) {
          if (!playerInstanceRef.current) {
            const newPlayer = new window.Spotify.Player({
              name: SPOTIFY_PLAYER_NAME,
              getOAuthToken: cb => cb(token),
              volume: 0.5
            });
            playerInstanceRef.current = newPlayer;
            // Error handling
            newPlayer.addListener('initialization_error', ({ message }) => toast.error('Spotify SDK init error: ' + message));
            newPlayer.addListener('authentication_error', ({ message }) => toast.error('Spotify SDK auth error: ' + message));
            newPlayer.addListener('account_error', ({ message }) => toast.error('Spotify SDK account error: ' + message));
            newPlayer.addListener('playback_error', ({ message }) => toast.error('Spotify SDK playback error: ' + message));
            // Ready
            newPlayer.addListener('ready', ({ device_id }) => {
              setDeviceId(device_id);
              setPlayer(newPlayer);
              spotifyApi.transferMyPlayback([device_id], { play: false });
              toast.success('Browser player ready!');
            });
            // State changed
            newPlayer.addListener('player_state_changed', state => {
              if (!state) return;
              setIsPlaying(!state.paused);
              setProgress(state.position);
              setVolume(state.volume * 100);
              setCurrentTrack(state.track_window.current_track ? {
                ...state.track_window.current_track,
                album: state.track_window.current_track.album || {}
              } : null);
              // Sync shuffle and repeat states
              setShuffleMode(state.shuffle);
              setRepeatMode(state.repeat_mode);
            });
            newPlayer.connect();
          }
        } else {
          setTimeout(tryInitPlayer, 500);
        }
      };
      tryInitPlayer();
    }
    // Cleanup: disconnect player on unmount
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.disconnect();
        playerInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [isLoggedIn]);

  // 3. Progress bar update for SDK
  useEffect(() => {
    if (isLoggedIn && isPlaying && player) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => prev + 1000);
      }, 1000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isLoggedIn, isPlaying, player]);

  // Close player box when clicking outside
  useEffect(() => {
    if (!showPlayer) return;
    function handleClickOutside(event) {
      // Don't close if clicking on liked songs modal
      if (likedSongsModalRef.current && likedSongsModalRef.current.contains(event.target)) {
        return;
      }
      // Don't close if clicking on global search modal
      const globalSearchModal = document.querySelector('[data-global-search-modal]');
      if (globalSearchModal && globalSearchModal.contains(event.target)) {
        return;
      }
      if (playerPanelRef.current && !playerPanelRef.current.contains(event.target)) {
        setShowPlayer(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlayer]);

  // Close liked songs modal when clicking outside
  useEffect(() => {
    if (!showLikedSongs) return;
    function handleClickOutside(event) {
      if (likedSongsModalRef.current && !likedSongsModalRef.current.contains(event.target)) {
        setShowLikedSongs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLikedSongs]);

  // Close global search modal when clicking outside
  useEffect(() => {
    if (!showGlobalSearch) return;
    function handleClickOutside(event) {
      const modal = document.querySelector('[data-global-search-modal]');
      if (modal && !modal.contains(event.target)) {
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
        setGlobalSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGlobalSearch]);

  // Handle infinite scroll for liked songs
  useEffect(() => {
    if (!showLikedSongs || !hasMoreLikedSongs || loadingLiked) return;
    
    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        fetchLikedSongs(false);
      }
    };

    const listElement = document.querySelector('.spotify-liked-songs-list');
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [showLikedSongs, hasMoreLikedSongs, loadingLiked, likedSongsOffset]);

  // Fetch all liked songs for search
  const fetchAllLikedSongs = async () => {
    setSearchingAllSongs(true);
    try {
      let allSongs = [];
      let offset = 0;
      const limit = 50;
      
      while (true) {
        const res = await spotifyApi.getMySavedTracks({ limit, offset });
        const songs = res.items || [];
        allSongs = [...allSongs, ...songs];
        
        if (songs.length < limit) break;
        offset += limit;
      }
      
      setAllLikedSongs(allSongs);
    } catch (error) {
      console.error('Error fetching all liked songs:', error);
      toast.error('Could not fetch all songs for search');
    } finally {
      setSearchingAllSongs(false);
    }
  };

  // Global search function with debouncing
  const searchGlobalSongs = async (query) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      return;
    }
    
    setSearchingGlobal(true);
    try {
      const results = await spotifyApi.search(query, ['track'], { limit: 15 });
      setGlobalSearchResults(results.tracks?.items || []);
    } catch (error) {
      console.error('Global search error:', error);
      toast.error('Could not search for songs');
      setGlobalSearchResults([]);
    } finally {
      setSearchingGlobal(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (globalSearchQuery.trim()) {
        searchGlobalSongs(globalSearchQuery);
      } else {
        setGlobalSearchResults([]);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [globalSearchQuery]);

  // Toggle shuffle mode
  const toggleShuffle = async () => {
    try {
      const newShuffleMode = !shuffleMode;
      if (player && deviceId) {
        await spotifyApi.setShuffle(newShuffleMode, { device_id: deviceId });
      } else {
        await spotifyApi.setShuffle(newShuffleMode);
      }
      setShuffleMode(newShuffleMode);
      toast.success(newShuffleMode ? 'Shuffle On' : 'Shuffle Off');
    } catch (error) {
      console.error('Error toggling shuffle:', error);
      toast.error('Could not toggle shuffle');
    }
  };

  // Toggle repeat mode
  const toggleRepeat = async () => {
    try {
      let newRepeatMode;
      if (repeatMode === 'off') {
        newRepeatMode = 'context';
      } else if (repeatMode === 'context') {
        newRepeatMode = 'track';
      } else {
        newRepeatMode = 'off';
      }

      if (player && deviceId) {
        await spotifyApi.setRepeat(newRepeatMode, { device_id: deviceId });
      } else {
        await spotifyApi.setRepeat(newRepeatMode);
      }
      setRepeatMode(newRepeatMode);
      
      const messages = {
        'off': 'Repeat Off',
        'track': 'Repeat Track',
        'context': 'Repeat All'
      };
      toast.success(messages[newRepeatMode]);
    } catch (error) {
      console.error('Error toggling repeat:', error);
      toast.error('Could not toggle repeat');
    }
  };

  // Play a global search result
  const playGlobalSong = async (track) => {
    try {
      // First, check if we have an active device
      const devices = await spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(d => d.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        toast.error('No active Spotify device found. Please open Spotify on your phone, desktop, or web player.');
        return;
      }

      // Play the track directly
      if (player && deviceId) {
        await spotifyApi.play({
          device_id: deviceId,
          uris: [track.uri],
        });
      } else {
        await spotifyApi.play({
          device_id: activeDevice.id,
          uris: [track.uri],
        });
      }
      
      toast.success('Playing: ' + track.name);
      setShowGlobalSearch(false);
      setGlobalSearchQuery('');
      
      // Update current track after a short delay
      setTimeout(async () => {
        await fetchCurrentTrack();
      }, 1000);
    } catch (error) {
      console.error('Error playing global song:', error);
      
      // Check if it's a device-related error
      if (error.status === 404) {
        toast.error('No active Spotify device. Please open Spotify on your phone, desktop, or web player and try again.');
      } else {
        toast.error('Could not play song. Please make sure you have Spotify Premium.');
      }
    }
  };

  // Filter liked songs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLikedSongs(likedSongs);
    } else {
      // If searching, use all songs if available, otherwise use loaded songs
      const songsToSearch = allLikedSongs.length > 0 ? allLikedSongs : likedSongs;
      
      const filtered = songsToSearch.filter(({ track }) => {
        const query = searchQuery.toLowerCase();
        const trackName = track.name.toLowerCase();
        const artistNames = track.artists.map(artist => artist.name.toLowerCase()).join(' ');
        const albumName = track.album.name.toLowerCase();
        
        return trackName.includes(query) || 
               artistNames.includes(query) || 
               albumName.includes(query);
      });
      setFilteredLikedSongs(filtered);
    }
  }, [searchQuery, likedSongs, allLikedSongs]);

  const login = () => {
    if (!CLIENT_ID || CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
      toast.error('Spotify Client ID not configured. Please check the setup guide.');
      return;
    }
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&show_dialog=true&state=${Math.random().toString(36).substring(7)}`;
    
    // Debug: Log the URL being sent
    console.log('Spotify Auth URL:', authUrl);
    console.log('Client ID:', CLIENT_ID);
    console.log('Client Secret:', import.meta.env.VITE_SPOTIFY_CLIENT_SECRET ? '***' + import.meta.env.VITE_SPOTIFY_CLIENT_SECRET.slice(-4) : 'Not set');
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Environment variables:');
    console.log('- VITE_SPOTIFY_CLIENT_ID:', import.meta.env.VITE_SPOTIFY_CLIENT_ID);
    console.log('- VITE_SPOTIFY_REDIRECT_URI:', import.meta.env.VITE_SPOTIFY_REDIRECT_URI);
    console.log('- VITE_SPOTIFY_CLIENT_SECRET:', import.meta.env.VITE_SPOTIFY_CLIENT_SECRET);
    
    // Check if we're logged in before redirecting
    console.log('Current user context:', user);
    
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem('spotify_token');
    setIsLoggedIn(false);
    setCurrentTrack(null);
    setIsPlaying(false);
    setUserProfile(null);
    setShowPlayer(false);
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await spotifyApi.getMe();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    }
  };

  const fetchCurrentTrack = async () => {
    try {
      const track = await spotifyApi.getMyCurrentPlayingTrack();
      if (track.item) {
        setCurrentTrack(track.item);
        setIsPlaying(track.is_playing);
        setProgress(track.progress_ms || 0);
      }
    } catch (error) {
      console.error('Error fetching current track:', error);
    }
  };

  const updateProgress = async () => {
    try {
      const track = await spotifyApi.getMyCurrentPlayingTrack();
      if (track.item) {
        setProgress(track.progress_ms || 0);
        setIsPlaying(track.is_playing);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // 4. Playback controls using SDK if available
  const togglePlayPause = async () => {
    try {
      if (player) {
        await player.togglePlay();
      } else {
        if (isPlaying) {
          await spotifyApi.pause();
          setIsPlaying(false);
        } else {
          await spotifyApi.play();
          setIsPlaying(true);
        }
      }
      // Update current track after a short delay
      setTimeout(async () => {
        await fetchCurrentTrack();
      }, 500);
    } catch (error) {
      console.error('Toggle play/pause error:', error);
      toast.error('Failed to control playback. Make sure you have Spotify Premium.');
    }
  };

  const skipToNext = async () => {
    try {
      // If we have a current track, try to get a smart next track
      if (currentTrack) {
        try {
          // First try to get recently played tracks
          const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 20 });
          
          if (recentlyPlayed.items && recentlyPlayed.items.length > 0) {
            // Find a track that's different from the current one and not too recent
            const nextTrack = recentlyPlayed.items.find(item => 
              item.track.id !== currentTrack.id && 
              item.track.id !== currentTrack.id
            )?.track || recentlyPlayed.items[0].track;
            
            // Play the selected track
            if (player && deviceId) {
              await spotifyApi.play({
                device_id: deviceId,
                uris: [nextTrack.uri],
              });
            } else {
              await spotifyApi.play({
                uris: [nextTrack.uri],
              });
            }
            
            toast.success(`Playing from your history: ${nextTrack.name}`);
            
            // Update current track after a short delay
            setTimeout(async () => {
              await fetchCurrentTrack();
            }, 500);
            return;
          }
        } catch (recentError) {
          console.log('Recently played fallback failed, trying top tracks');
        }
        
        try {
          // Fallback to user's top tracks
          const topTracks = await spotifyApi.getMyTopTracks({ limit: 20 });
          
          if (topTracks.items && topTracks.items.length > 0) {
            // Find a track that's different from the current one
            const nextTrack = topTracks.items.find(track => track.id !== currentTrack.id) || topTracks.items[0];
            
            // Play the selected track
            if (player && deviceId) {
              await spotifyApi.play({
                device_id: deviceId,
                uris: [nextTrack.uri],
              });
            } else {
              await spotifyApi.play({
                uris: [nextTrack.uri],
              });
            }
            
            toast.success(`Playing from your favorites: ${nextTrack.name}`);
            
            // Update current track after a short delay
            setTimeout(async () => {
              await fetchCurrentTrack();
            }, 500);
            return;
          }
        } catch (topTracksError) {
          console.log('Top tracks fallback failed, using normal next track');
        }
      }
      
      // Final fallback to normal next track behavior
      if (player) {
        await player.nextTrack();
      } else {
        await spotifyApi.skipToNext();
      }
      
      // Update current track after a short delay
      setTimeout(async () => {
        await fetchCurrentTrack();
      }, 500);
    } catch (error) {
      console.error('Skip next error:', error);
      toast.error('Failed to skip to next track. Make sure you have Spotify Premium.');
    }
  };

  const skipToPrevious = async () => {
    try {
      if (player) {
        await player.previousTrack();
      } else {
        await spotifyApi.skipToPrevious();
      }
      // Update current track after a short delay
      setTimeout(async () => {
        await fetchCurrentTrack();
      }, 500);
    } catch (error) {
      console.error('Skip previous error:', error);
      toast.error('Failed to skip to previous track. Make sure you have Spotify Premium.');
    }
  };

  const setVolumeLevel = async (newVolume) => {
    if (player) {
      player.setVolume(newVolume / 100);
      setVolume(newVolume);
    } else {
      try {
        await spotifyApi.setVolume(newVolume);
        setVolume(newVolume);
      } catch (error) {
        toast.error('Error setting volume');
      }
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fetch available devices
  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const result = await spotifyApi.getMyDevices();
      setDevices(result.devices || []);
    } catch (error) {
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const openDeviceModal = async () => {
    await fetchDevices();
    setShowDeviceModal(true);
  };

  const closeDeviceModal = () => {
    setShowDeviceModal(false);
  };

  const transferPlayback = async (deviceId) => {
    try {
      await spotifyApi.transferMyPlayback([deviceId], { play: true });
      toast.success('Playback transferred!');
      setShowDeviceModal(false);
      setTimeout(fetchCurrentTrack, 1000);
    } catch (error) {
      toast.error('Failed to transfer playback');
    }
  };

  // Play Liked Songs
  const playLikedSongs = async () => {
    try {
      if (player && deviceId) {
        await spotifyApi.play({
          device_id: deviceId,
          context_uri: 'spotify:collection',
        });
      } else {
        await spotifyApi.play({
          context_uri: 'spotify:collection',
        });
      }
      toast.success('Playing Liked Songs');
    } catch (error) {
      toast.error('Could not play Liked Songs');
    }
  };

  // Fetch liked songs
  const fetchLikedSongs = async (reset = true) => {
    if (reset) {
      setLikedSongsOffset(0);
      setHasMoreLikedSongs(true);
      setLoadingLiked(true);
    } else {
      setLoadingLiked(true);
    }
    
    try {
      const res = await spotifyApi.getMySavedTracks({ 
        limit: 20, 
        offset: reset ? 0 : likedSongsOffset 
      });
      
      if (reset) {
        setLikedSongs(res.items || []);
      } else {
        setLikedSongs(prev => [...prev, ...(res.items || [])]);
      }
      
      setLikedSongsOffset(prev => prev + (res.items?.length || 0));
      setHasMoreLikedSongs((res.items?.length || 0) === 20);
      setLikedSongsError(null);
    } catch (err) {
      if (reset) {
        setLikedSongs([]);
      }
      let msg = 'Could not fetch liked songs.';
      if (err?.status === 401 || err?.status === 403) {
        msg = 'Spotify authorization error. Please log out and log in again to grant access to your Liked Songs.';
      }
      setLikedSongsError(msg);
    } finally {
      setLoadingLiked(false);
    }
  };

  // Play a specific liked song
  const playLikedSong = async (track) => {
    console.log('Playing liked song:', track.name, track.uri);
    try {
      // First, check if we have an active device
      const devices = await spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(d => d.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        toast.error('No active Spotify device found. Please open Spotify on your phone, desktop, or web player.');
        return;
      }

      if (player && deviceId) {
        console.log('Using SDK player with device:', deviceId);
        // Play the track in the context of Liked Songs collection
        await spotifyApi.play({
          device_id: deviceId,
          context_uri: 'spotify:collection',
          offset: { uri: track.uri }
        });
      } else {
        console.log('Using Web API with device:', activeDevice.id);
        // Play the track in the context of Liked Songs collection
        await spotifyApi.play({
          device_id: activeDevice.id,
          context_uri: 'spotify:collection',
          offset: { uri: track.uri }
        });
      }
      toast.success('Playing: ' + track.name);
      
      // Update current track and ensure SDK is synced
      setTimeout(async () => {
        await fetchCurrentTrack();
        // Force SDK player to sync with current playback state
        if (player) {
          try {
            await player.getCurrentState();
          } catch (err) {
            console.log('SDK sync attempt:', err);
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Error playing liked song:', error);
      
      // Check if it's a device-related error
      if (error.status === 404) {
        toast.error('No active Spotify device. Please open Spotify on your phone, desktop, or web player and try again.');
        return;
      }
      
      // Fallback to playing single track if context fails
      try {
        const devices = await spotifyApi.getMyDevices();
        const activeDevice = devices.devices.find(d => d.is_active) || devices.devices[0];
        
        if (activeDevice) {
          if (player && deviceId) {
            await spotifyApi.play({
              device_id: deviceId,
              uris: [track.uri],
            });
          } else {
            await spotifyApi.play({
              device_id: activeDevice.id,
              uris: [track.uri],
            });
          }
          toast.success('Playing: ' + track.name);
        } else {
          toast.error('No active Spotify device found. Please open Spotify on your phone, desktop, or web player.');
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        if (fallbackError.status === 404) {
          toast.error('No active Spotify device. Please open Spotify on your phone, desktop, or web player and try again.');
        } else {
          toast.error('Could not play song. Please make sure you have Spotify Premium.');
        }
      }
    }
  };

  // Provide context value
  const contextValue = {
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    isPlaying,
    openPlayer: () => setShowPlayer(true),
  };

  return (
    <SpotifyPlayerContext.Provider value={contextValue}>
      <div className="spotify-player-container">
        {!isLoggedIn ? (
          <button 
            className="spotify-login-btn"
            onClick={login}
            title="Login to Spotify"
          >
            <FiMusic size={16} />
            <span>Connect Spotify</span>
          </button>
        ) : (
          <div className="spotify-player-simple">
            <button 
              className="spotify-toggle-btn"
              onClick={() => setShowPlayer(!showPlayer)}
              title={showPlayer ? "Hide Player" : "Show Player"}
            >
              <FiMusic size={16} />
              <EqualizerBars isPlaying={isPlaying} />
            </button>

            {showPlayer && (
              ReactDOM.createPortal(
                <div ref={playerPanelRef} className="spotify-player-panel" style={{minWidth: 0, width: 400, padding: 20, borderRadius: 16, position: 'absolute', top: 70, right: 40, zIndex: 2000, overflow: 'hidden'}}>
                  {/* Blurred album art background */}
                  {currentTrack?.album?.images?.[0]?.url && (
                    <div
                      className="spotify-player-blur-bg"
                      style={{backgroundImage: `url('${currentTrack.album.images[0].url}')`}}
                    />
                  )}
                  <button
                    onClick={() => setShowGlobalSearch(true)}
                    title="Search Worldwide"
                    style={{position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', color: '#1db954', fontSize: 22, cursor: 'pointer', zIndex: 2}}
                  >
                    <FiSearch />
                  </button>
                  <button
                    onClick={async () => { 
                      setShowLikedSongs(true); 
                      setSearchQuery(''); // Reset search when opening
                      if (likedSongs.length === 0) {
                        await fetchLikedSongs(true);
                      } else {
                        // Reset the list when reopening
                        await fetchLikedSongs(true);
                      }
                    }}
                    title="Show Liked Songs"
                    style={{position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#1db954', fontSize: 22, cursor: 'pointer', zIndex: 2}}
                  >
                    <FiHeart />
                  </button>

                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative', zIndex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      {userProfile?.images?.[0]?.url && (
                        <img 
                          src={userProfile.images[0].url} 
                          alt={userProfile.display_name}
                          style={{width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #1db954'}}
                        />
                      )}
                      <span style={{fontSize: 13, fontWeight: 600}}>{userProfile?.display_name}</span>
                    </div>
                    <button 
                      className="logout-btn"
                      onClick={logout}
                      title="Logout from Spotify"
                      style={{fontSize: 13, padding: '2px 6px'}}
                    >
                      <FiLogOut size={13} />
                    </button>
                  </div>

                  {currentTrack ? (
                    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, position: 'relative', zIndex: 1}}>
                      <img 
                        src={currentTrack.album.images[0]?.url} 
                        alt={currentTrack.name}
                        style={{width: 36, height: 36, borderRadius: 8, objectFit: 'cover', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', marginLeft: -6}}
                      />
                      <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0}}>
                        <div style={{fontSize: 16, fontWeight: 700, color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1.1}}>{currentTrack.name}</div>
                        <div style={{fontSize: 13, color: '#e0ffe0', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', marginTop: 0, lineHeight: 1.1}}>{currentTrack.artists.map(artist => artist.name).join(', ')}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', color: '#e0ffe0', fontSize: 13, margin: '16px 0', position: 'relative', zIndex: 1}}>No track playing</div>
                  )}

                  {currentTrack && (
                    <>
                      <div style={{display: 'flex', alignItems: 'center', gap: 6, width: '100%', marginBottom: 6, position: 'relative', zIndex: 1}}>
                        <span style={{fontSize: 10, color: '#e0ffe0', minWidth: 24}}>{formatTime(progress)}</span>
                        <div
                          style={{flex: 1, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, overflow: 'hidden', position: 'relative', cursor: 'pointer'}}
                          onClick={async (e) => {
                            const bar = e.currentTarget;
                            const rect = bar.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const percent = Math.max(0, Math.min(1, x / rect.width));
                            const newPosition = Math.floor(percent * currentTrack.duration_ms);
                            setProgress(newPosition);
                            if (player) {
                              player.seek(newPosition);
                            } else {
                              try {
                                await spotifyApi.seek(newPosition);
                              } catch (err) {}
                            }
                          }}
                        >
                          <div
                            style={{height: '100%', background: 'linear-gradient(90deg, #1db954 0%, #1ed760 100%)', borderRadius: 2, width: `${currentTrack.duration_ms ? (progress / currentTrack.duration_ms) * 100 : 0}%`, transition: 'width 0.3s'}}
                          ></div>
                        </div>
                        <span style={{fontSize: 10, color: '#e0ffe0', minWidth: 24}}>{formatDuration(currentTrack.duration_ms)}</span>
                      </div>

                      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginBottom: 6, position: 'relative', zIndex: 1}}>
                        <button 
                          className="spotify-player-glass-btn"
                          onClick={toggleShuffle}
                          title="Shuffle"
                          style={{color: shuffleMode ? '#1db954' : '#fff'}}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                          </svg>
                        </button>
                        <button 
                          className="spotify-player-glass-btn"
                          onClick={skipToPrevious}
                          title="Previous"
                        >
                          <FiSkipBack size={22} />
                        </button>
                        <button 
                          className="spotify-player-glass-btn play"
                          onClick={togglePlayPause}
                          title={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? <FiPause size={28} /> : <FiPlay size={28} />}
                        </button>
                        <button 
                          className="spotify-player-glass-btn"
                          onClick={skipToNext}
                          title="Next"
                        >
                          <FiSkipForward size={22} />
                        </button>
                        <button 
                          className="spotify-player-glass-btn"
                          onClick={toggleRepeat}
                          title={`Repeat: ${repeatMode === 'off' ? 'Off' : repeatMode === 'track' ? 'Track' : 'All'}`}
                          style={{color: repeatMode !== 'off' ? '#1db954' : '#fff'}}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                            {repeatMode === 'track' && (
                              <circle cx="12" cy="12" r="3" fill="currentColor"/>
                            )}
                          </svg>
                        </button>
                      </div>

                      <div style={{display: 'flex', alignItems: 'center', gap: 6, width: '100%', position: 'relative', zIndex: 1}}>
                        <FiVolume2 size={12} />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={isNaN(volume) ? 50 : volume}
                          onChange={async (e) => {
                            const newVol = parseInt(e.target.value);
                            setVolume(newVol);
                            try { await spotifyApi.setVolume(newVol); } catch (err) { /* ignore */ }
                          }}
                          style={{flex: 1, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2}}
                        />
                      </div>
                    </>
                  )}
                </div>,
                document.body
              )
            )}
            
                        {/* Liked Songs Modal - Outside Player Panel */}
            {showLikedSongs && (
              ReactDOM.createPortal(
                <div ref={likedSongsModalRef} className="spotify-liked-songs-modal">
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #222', background: '#232526'}}>
                    <span style={{fontWeight: 600, color: '#fff'}}>Liked Songs</span>
                    <button onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowLikedSongs(false);
                    }} style={{background: 'none', border: 'none', color: '#aaa', fontSize: 18, cursor: 'pointer'}}>&times;</button>
                  </div>
                  
                  {/* Search Input */}
                  <div style={{padding: '12px 16px', borderBottom: '1px solid #222', background: '#1a1a1a'}}>
                    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                      <input
                        type="text"
                        placeholder="Search songs, artists, or albums..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #333',
                          background: '#2a2a2a',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setSearchQuery('');
                            setAllLikedSongs([]);
                          }
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            fetchAllLikedSongs();
                          }
                        }}
                      />
                      {searchQuery.trim() && (
                        <button
                          onClick={() => fetchAllLikedSongs()}
                          disabled={searchingAllSongs}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: searchingAllSongs ? '#333' : '#1db954',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: searchingAllSongs ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                          }}
                        >
                          {searchingAllSongs ? 'Searching...' : 'Search All'}
                        </button>
                      )}
                    </div>
                    {searchQuery.trim() && allLikedSongs.length === 0 && (
                      <div style={{marginTop: 8, fontSize: '11px', color: '#888'}}>
                        Press Enter or click "Search All" to search through all your liked songs
                      </div>
                    )}
                  </div>
                  
                  <div className="spotify-liked-songs-list">
                    {likedSongsError ? (
                      <div style={{color: '#ff6b6b', textAlign: 'center', padding: 24}}>{likedSongsError}</div>
                    ) : searchingAllSongs ? (
                      <div style={{color: '#1db954', textAlign: 'center', padding: 24, fontSize: 14}}>
                        Searching through all your liked songs...
                      </div>
                    ) : filteredLikedSongs.length === 0 && !loadingLiked ? (
                      <div style={{color: '#aaa', textAlign: 'center', padding: 24}}>
                        {searchQuery ? `No songs found for "${searchQuery}"` : 'No liked songs found.'}
                      </div>
                    ) : (
                      <>
                        {filteredLikedSongs.map(({ track }) => (
                          <div key={track.id} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #222', transition: 'background 0.2s'}} 
                               onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'} 
                               onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 console.log('Clicked track:', track);
                                 playLikedSong(track);
                               }}>
                            <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt={track.name} style={{width: 36, height: 36, borderRadius: 6, objectFit: 'cover'}} />
                            <div style={{flex: 1, minWidth: 0}}>
                              <div style={{fontWeight: 600, color: '#fff', fontSize: 14, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}>{track.name}</div>
                              <div style={{color: '#b0b0b0', fontSize: 12, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}>{track.artists.map(a => a.name).join(', ')}</div>
                            </div>
                          </div>
                        ))}
                        {loadingLiked && !searchQuery && (
                          <div style={{color: '#1db954', textAlign: 'center', padding: 16, fontSize: 12}}>
                            Loading more songs...
                          </div>
                        )}
                        {!hasMoreLikedSongs && likedSongs.length > 0 && !searchQuery && (
                          <div style={{color: '#666', textAlign: 'center', padding: 16, fontSize: 12}}>
                            No more songs to load
                          </div>
                        )}
                        {searchQuery && allLikedSongs.length > 0 && (
                          <div style={{color: '#1db954', textAlign: 'center', padding: 16, fontSize: 12}}>
                            Found {filteredLikedSongs.length} result{filteredLikedSongs.length !== 1 ? 's' : ''} from {allLikedSongs.length} total songs
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>,
                document.body
              )
            )}
            
            {/* Global Search Modal */}
            {showGlobalSearch && (
              ReactDOM.createPortal(
                <div 
                  data-global-search-modal
                  style={{
                    position: 'fixed',
                    top: 90,
                    right: 60,
                    width: '340px',
                    maxHeight: '420px',
                    background: 'rgba(24,24,24,0.98)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 1.5px 8px #1db95444',
                    zIndex: 3000,
                    overflow: 'hidden',
                    border: '1.5px solid #222',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    animation: 'spotifyLikedModalIn 0.18s cubic-bezier(.4,2,.6,1) both'
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #222', background: '#232526'}}>
                    <span style={{fontWeight: 600, color: '#fff'}}>Search Worldwide</span>
                    <button onClick={() => {
                      setShowGlobalSearch(false);
                      setGlobalSearchQuery('');
                      setGlobalSearchResults([]);
                    }} style={{background: 'none', border: 'none', color: '#aaa', fontSize: 18, cursor: 'pointer'}}>&times;</button>
                  </div>
                  
                  <div style={{padding: '12px 16px', borderBottom: '1px solid #222', background: '#1a1a1a'}}>
                    <input
                      type="text"
                      placeholder="Search for any song, artist, or album..."
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #333',
                        background: '#2a2a2a',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowGlobalSearch(false);
                          setGlobalSearchQuery('');
                          setGlobalSearchResults([]);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  
                  <div style={{maxHeight: '270px', overflowY: 'auto', background: '#181818'}}>
                    {searchingGlobal ? (
                      <div style={{color: '#1db954', textAlign: 'center', padding: 24, fontSize: 14}}>
                        Searching worldwide...
                      </div>
                    ) : globalSearchResults.length === 0 && globalSearchQuery ? (
                      <div style={{color: '#aaa', textAlign: 'center', padding: 24}}>
                        No songs found for "{globalSearchQuery}"
                      </div>
                    ) : globalSearchQuery && globalSearchResults.length > 0 ? (
                      <div style={{color: '#1db954', textAlign: 'center', padding: 8, fontSize: 11, background: '#232526'}}>
                        Found {globalSearchResults.length} result{globalSearchResults.length !== 1 ? 's' : ''}
                      </div>
                    ) : null}
                    
                    {globalSearchResults.map((track) => (
                      <div key={track.id} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #222', transition: 'background 0.2s'}} 
                           onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'} 
                           onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                           onClick={() => playGlobalSong(track)}>
                        <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt={track.name} style={{width: 36, height: 36, borderRadius: 6, objectFit: 'cover'}} />
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{fontWeight: 600, color: '#fff', fontSize: 14, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}>{track.name}</div>
                          <div style={{color: '#b0b0b0', fontSize: 12, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}>{track.artists.map(a => a.name).join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>,
                document.body
              )
            )}
            
            <button 
              className="device-selector-btn"
              onClick={openDeviceModal}
              title="Select Device"
              style={{marginLeft: 8, padding: '4px 10px', borderRadius: 6, background: '#222', color: '#1db954', border: 'none', fontWeight: 500, cursor: 'pointer'}}>
              Devices
            </button>
            <Modal
              isOpen={showDeviceModal}
              onRequestClose={closeDeviceModal}
              contentLabel="Device Selector"
              style={{
                overlay: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },
                content: { maxWidth: 400, margin: 'auto', borderRadius: 12, padding: 24, background: '#181818', color: '#fff' }
              }}
              ariaHideApp={false}
            >
              <h3 style={{marginBottom: 16}}>Select a Spotify Device</h3>
              {loadingDevices ? (
                <div>Loading devices...</div>
              ) : devices.length === 0 ? (
                <div>No devices found. Open Spotify on your phone, desktop, or web player.</div>
              ) : (
                <ul style={{listStyle: 'none', padding: 0}}>
                  {devices.map(device => (
                    <li key={device.id} style={{marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <span>
                        {device.name} <span style={{fontSize: 12, color: '#aaa'}}>({device.type})</span>
                        {device.is_active && <span style={{color: '#1db954', marginLeft: 8}}>(Active)</span>}
                        {device.id === deviceId && <span style={{color: '#1db954', marginLeft: 8}}>(Browser)</span>}
                      </span>
                      <button
                        style={{marginLeft: 12, padding: '4px 10px', borderRadius: 6, background: device.is_active ? '#1db954' : '#333', color: '#fff', border: 'none', fontWeight: 500, cursor: 'pointer'}}
                        disabled={device.is_active}
                        onClick={() => transferPlayback(device.id)}
                      >
                        {device.is_active ? 'Current' : 'Transfer'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={closeDeviceModal} style={{marginTop: 18, padding: '6px 18px', borderRadius: 6, background: '#333', color: '#fff', border: 'none', fontWeight: 500, cursor: 'pointer'}}>Close</button>
            </Modal>
          </div>
        )}
      </div>
    </SpotifyPlayerContext.Provider>
  );
};

export default SpotifyPlayer; 