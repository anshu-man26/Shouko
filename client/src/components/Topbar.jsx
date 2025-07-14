import React, { useContext, useState, useEffect, useRef } from 'react'
import {Link, useNavigate} from 'react-router-dom'
import "../components/Topbar.css"
import { UserContext } from '../../context/userContext'
import api from '../api'
import { toast } from 'react-hot-toast'
import shokoLogo from  "../assets/shokoTM.png"
import { FiSearch, FiLogOut, FiUser, FiX, FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi'
import CaseDetailsModal from './CaseDetailsModal'
import SpotifyPlayer, { SpotifyPlayerContext } from './SpotifyPlayer'

const Topbar = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const spotifyControls = useContext(SpotifyPlayerContext);

  // Fetch cases for search
  const fetchCases = async () => {
    try {
      const response = await api.get('/cases', {
        params: { userId: user?.id }
      });
      return response.data.cases || [];
    } catch (error) {
      console.log('Error fetching cases for search:', error);
      return [];
    }
  };

  // Search cases based on query
  const searchCases = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const cases = await fetchCases();
      const filteredCases = cases.filter(caseItem => 
        caseItem.title?.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.description?.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.status?.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.priority?.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredCases.slice(0, 10)); // Show more results for horizontal layout
      setShowSuggestions(true);
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCases(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or perform search action
      console.log('Searching for:', searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (caseItem) => {
    setSelectedCase(caseItem);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const closeCaseModal = () => {
    setSelectedCase(null);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      // Clear all localStorage data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('spotify_token');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.log('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ff4444';
      case 'Medium': return '#ffaa00';
      case 'Low': return '#44aa44';
      default: return '#666666';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#ff4444';
      case 'In Progress': return '#ffaa00';
      case 'Closed': return '#44aa44';
      default: return '#666666';
    }
  };

  return (
    <>
    <div className='navbar'>
          <Link to="/" className="logo-link">
              <img className='navbarLogo' src={shokoLogo} alt="Shouko Logo" />
          </Link>

          <div className='profile'>
              <div className="search-container" ref={searchRef}>
                  <form className='navbarSearch' onSubmit={handleSearchSubmit}>
                      <input 
                          type="text" 
                          placeholder="Search cases..." 
                          name="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => searchQuery && setShowSuggestions(true)}
                      />
                      {searchQuery && (
                          <button 
                              type="button" 
                              className="clear-search-btn"
                              onClick={clearSearch}
                          >
                              <FiX size={14} />
                          </button>
                      )}
                      <button className="button" type="submit">
                          <FiSearch size={14} />
                      </button>
                  </form>

                  {/* Vertical Search Suggestions */}
                  {showSuggestions && (
                      <div className="search-suggestions" ref={suggestionsRef}>
                          {isSearching ? (
                              <div className="search-loading">
                                  <div className="loading-spinner"></div>
                                  <span>Searching...</span>
                              </div>
                          ) : searchResults.length > 0 ? (
                              <div className="suggestions-list">
                                  {searchResults.map((caseItem, index) => (
                                      <div 
                                          key={caseItem._id || index}
                                          className="suggestion-item"
                                          onClick={() => handleSuggestionClick(caseItem)}
                                      >
                                          <span className="suggestion-title-text">{caseItem.title}</span>
                                      </div>
                                  ))}
                              </div>
                          ) : searchQuery && (
                              <div className="no-results">
                                  <span>No cases found for "{searchQuery}"</span>
                              </div>
                          )}
                      </div>
                  )}
            </div>
            <SpotifyPlayer />

              <div className='profile2'>
                {user ? (
                  <div className="user-info">
                    <div className="user-details">
                      <FiUser size={16} className="user-icon" />
                      <span className="welcome-text">Welcome, {user.name}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="logout-btn"
                      title="Logout"
                    >
                      <FiLogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="user-info">
                    <div className="user-details">
                      <FiUser size={16} className="user-icon" />
                      <span className="welcome-text">Not logged in</span>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
        
      {/* Case Details Modal */}
      {selectedCase && (
        <CaseDetailsModal 
          caseData={selectedCase} 
          onClose={closeCaseModal} 
        />
      )}
    </>
  )
}

export default Topbar