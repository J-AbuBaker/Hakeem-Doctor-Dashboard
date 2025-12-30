import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { X, MapPin, Search, Navigation, Crosshair, Navigation2, ArrowLeftRight, Loader2, AlertCircle } from 'lucide-react';
import './ClinicLocationPickerModal.css';

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 'var(--radius-xl)',
};

const defaultCenter = {
  lat: 31.9522,
  lng: 35.2332,
};

const defaultZoom = 6;

interface ClinicLocationPickerModalProps {
  isOpen: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (latitude: number, longitude: number) => void;
  onCancel: () => void;
  onChange?: (latitude: number, longitude: number) => void;
}

const ClinicLocationPickerModal: React.FC<ClinicLocationPickerModalProps> = ({
  isOpen,
  initialLatitude,
  initialLongitude,
  onConfirm,
  onCancel,
  onChange,
}) => {
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [isGeolocationLoading, setIsGeolocationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
  const [zoom, setZoom] = useState<number>(defaultZoom);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  // Initialize coordinates when modal opens
  useEffect(() => {
    if (!isOpen || !isLoaded) return;

    // If initial coordinates exist, use them
    if (initialLatitude !== undefined && initialLongitude !== undefined) {
      const lat = initialLatitude;
      const lng = initialLongitude;
      setSelectedLat(lat);
      setSelectedLng(lng);
      setMapCenter({ lat, lng });
      setZoom(15);
      if (onChange) {
        onChange(lat, lng);
      }
      return;
    }

    // Otherwise, try to get user's current location
    setIsGeolocationLoading(true);
    if (navigator.geolocation) {
      const geolocationOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always get fresh location
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Validate coordinates
          if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
            // Fallback to default if invalid
            setSelectedLat(defaultCenter.lat);
            setSelectedLng(defaultCenter.lng);
            setMapCenter(defaultCenter);
            setZoom(defaultZoom);
            if (onChange) {
              onChange(defaultCenter.lat, defaultCenter.lng);
            }
            setIsGeolocationLoading(false);
            return;
          }

          setSelectedLat(lat);
          setSelectedLng(lng);
          setMapCenter({ lat, lng });
          setZoom(15);
          if (onChange) {
            onChange(lat, lng);
          }
          setIsGeolocationLoading(false);
        },
        () => {
          // If geolocation fails, use default center
          setSelectedLat(defaultCenter.lat);
          setSelectedLng(defaultCenter.lng);
          setMapCenter(defaultCenter);
          setZoom(defaultZoom);
          if (onChange) {
            onChange(defaultCenter.lat, defaultCenter.lng);
          }
          setIsGeolocationLoading(false);
        },
        geolocationOptions
      );
    } else {
      // Default to Middle East region if geolocation not available
      setSelectedLat(defaultCenter.lat);
      setSelectedLng(defaultCenter.lng);
      setMapCenter(defaultCenter);
      setZoom(defaultZoom);
      if (onChange) {
        onChange(defaultCenter.lat, defaultCenter.lng);
      }
      setIsGeolocationLoading(false);
    }
  }, [isOpen, initialLatitude, initialLongitude, onChange, isLoaded]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLat(lat);
      setSelectedLng(lng);
      setMapCenter({ lat, lng });
      setZoom(15);
      if (onChange) {
        onChange(lat, lng);
      }
    }
  }, [onChange]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLat(lat);
      setSelectedLng(lng);
      setMapCenter({ lat, lng });
      if (onChange) {
        onChange(lat, lng);
      }
    }
  }, [onChange]);

  const handlePlaceSelect = useCallback(() => {
    if (!isLoaded) {
      setSearchError('Google Maps API is not loaded. Please wait and try again.');
      return;
    }

    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const location = new google.maps.LatLng(lat, lng);

        // Pan map smoothly to the selected location if map is loaded
        if (map) {
          map.panTo(location);
          map.setZoom(15);
        }

        setSelectedLat(lat);
        setSelectedLng(lng);
        setMapCenter({ lat, lng });
        setZoom(15);
        setSearchQuery(place.formatted_address || place.name || '');
        setSearchError(null);
        if (onChange) {
          onChange(lat, lng);
        }
      } else {
        setSearchError('Location not found. Please try a different search term.');
      }
    }
  }, [onChange, map, isLoaded]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !isLoaded) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        setIsSearching(false);
        if (status === 'OK' && results && results.length > 0 && results[0] && map) {
          const location = results[0].geometry.location;
          if (location) {
            const lat = location.lat();
            const lng = location.lng();
            const latLng = new google.maps.LatLng(lat, lng);

            // Pan map smoothly to the search result location
            map.panTo(latLng);
            map.setZoom(15);

            setSelectedLat(lat);
            setSelectedLng(lng);
            setMapCenter({ lat, lng });
            setZoom(15);
            if (onChange) {
              onChange(lat, lng);
            }
            setSearchQuery(results[0].formatted_address || searchQuery);
            setSearchError(null);
          } else {
            setSearchError('Location not found. Please try a different search term.');
          }
        } else if (status === 'ZERO_RESULTS') {
          setSearchError('No results found. Please try a different search term.');
        } else if (status === 'OVER_QUERY_LIMIT') {
          setSearchError('Search quota exceeded. Please try again later.');
        } else if (status === 'REQUEST_DENIED') {
          setSearchError('Search request denied. Please check your API key configuration.');
        } else {
          setSearchError('Location not found. Please try a different search term.');
        }
      });
    } catch (error) {
      setIsSearching(false);
      setSearchError('Search failed. Please try again.');
      console.error('Geocoding error:', error);
    }
  }, [searchQuery, isLoaded, onChange, map]);

  const handleCurrentLocation = useCallback(() => {
    setIsGeolocationLoading(true);
    setSearchError(null);

    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      setIsGeolocationLoading(false);
      return;
    }

    // Geolocation options for accurate device location
    const geolocationOptions: PositionOptions = {
      enableHighAccuracy: true, // Use GPS if available for better accuracy
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0, // Don't use cached position, always get fresh location
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy; // Accuracy in meters

        // Validate coordinates are valid numbers
        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
          setSearchError('Invalid location data received. Please try again.');
          setIsGeolocationLoading(false);
          return;
        }

        if (!isLoaded) {
          setSearchError('Google Maps API is not loaded. Please wait and try again.');
          setIsGeolocationLoading(false);
          return;
        }

        const location = new google.maps.LatLng(lat, lng);

        // Pan map smoothly to current location
        if (map) {
          map.panTo(location);
          // Adjust zoom based on accuracy - more accurate = closer zoom
          const zoomLevel = accuracy < 100 ? 17 : accuracy < 500 ? 15 : 13;
          map.setZoom(zoomLevel);
          setZoom(zoomLevel);
        } else {
          setZoom(15);
        }

        setSelectedLat(lat);
        setSelectedLng(lng);
        setMapCenter({ lat, lng });

        if (onChange) {
          onChange(lat, lng);
        }
        setIsGeolocationLoading(false);
      },
      (error) => {
        // Provide specific error messages based on error code
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please try again.';
            break;
        }
        setSearchError(errorMessage);
        setIsGeolocationLoading(false);
      },
      geolocationOptions
    );
  }, [onChange, map, isLoaded]);

  const handleConfirm = () => {
    if (selectedLat !== null && selectedLng !== null) {
      onConfirm(selectedLat, selectedLng);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isOpen) return null;

  const hasSelection = selectedLat !== null && selectedLng !== null;

  // Show error if Google Maps API key is missing
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="modal-overlay clinic-location-modal-overlay" onClick={handleCancel}>
        <div className="modal-content clinic-location-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Choose Clinic Location</h2>
            <button className="modal-close" onClick={handleCancel} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="modal-body clinic-location-modal-body">
            <div className="map-error-message">
              <AlertCircle size={48} />
              <h3>Google Maps API Key Required</h3>
              <p>Please configure VITE_GOOGLE_MAPS_API_KEY in your .env file to use the map feature.</p>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while Google Maps API loads
  if (!isLoaded) {
    return (
      <div className="modal-overlay clinic-location-modal-overlay" onClick={handleCancel}>
        <div className="modal-content clinic-location-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Choose Clinic Location</h2>
            <button className="modal-close" onClick={handleCancel} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="modal-body clinic-location-modal-body">
            <div className="map-loading-state">
              <Loader2 className="loading-spinner" size={48} />
              <p>Loading map...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if Google Maps API failed to load
  if (loadError) {
    return (
      <div className="modal-overlay clinic-location-modal-overlay" onClick={handleCancel}>
        <div className="modal-content clinic-location-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Choose Clinic Location</h2>
            <button className="modal-close" onClick={handleCancel} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="modal-body clinic-location-modal-body">
            <div className="map-error-message">
              <AlertCircle size={48} />
              <h3>Failed to Load Map</h3>
              <p>Unable to load Google Maps. Please check your internet connection and try again.</p>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay clinic-location-modal-overlay" onClick={handleCancel}>
      <div className="modal-content clinic-location-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Choose Clinic Location</h2>
          <button className="modal-close" onClick={handleCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body clinic-location-modal-body">
          <div className="map-instructions">
            <div className="map-instructions-icon">
              <MapPin size={20} />
            </div>
            <div className="map-instructions-content">
              <h3 className="map-instructions-title">Select Your Clinic Location</h3>
              <p className="map-instructions-text">
                Search for a location, click on the map, or drag the marker to set your clinic location.
              </p>
            </div>
          </div>

          {/* Search Bar with Google Places Autocomplete */}
          <div className="map-search-container">
            <div className="map-search-input-wrapper">
              <Search className="search-icon" size={18} />
              <Autocomplete
                onLoad={(autocomplete) => {
                  autocompleteRef.current = autocomplete;
                }}
                onPlaceChanged={handlePlaceSelect}
                options={{
                  componentRestrictions: { country: ['ps', 'il', 'jo'] }, // Palestine, Israel, Jordan
                  fields: ['geometry', 'formatted_address', 'name'],
                  types: ['establishment', 'geocode'],
                }}
              >
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  className="map-search-input"
                  placeholder="Search for an address, city, or place..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSearching) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  disabled={isSearching}
                />
              </Autocomplete>
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchError(null);
                    if (autocompleteInputRef.current) {
                      autocompleteInputRef.current.value = '';
                    }
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                className="search-submit-btn"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                aria-label="Search location"
              >
                {isSearching ? (
                  <div className="search-spinner"></div>
                ) : (
                  <Search size={18} />
                )}
              </button>
            </div>
            {searchError && (
              <div className="search-error">
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="map-controls-bar">
            <button
              type="button"
              className="map-control-btn"
              onClick={handleCurrentLocation}
              disabled={isGeolocationLoading}
              title="Use current location"
            >
              {isGeolocationLoading ? (
                <div className="control-spinner"></div>
              ) : (
                <Navigation size={18} />
              )}
              <span>My Location</span>
            </button>
            {hasSelection && (
              <div className="map-control-info">
                <Crosshair size={16} />
                <span>Click map or drag marker to adjust</span>
              </div>
            )}
          </div>

          {isGeolocationLoading && (
            <div className="geolocation-loading">
              <div className="geolocation-loading-spinner"></div>
              <MapPin className="loading-icon" size={18} />
              <span>Locating your position...</span>
            </div>
          )}

          <div className="map-container-wrapper">
            <div className="map-container" ref={mapRef}>
              {!hasSelection && (
                <div className="map-overlay-instruction">
                  <Crosshair size={16} />
                  <span>Click on map to select location</span>
                </div>
              )}
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={zoom}
                onClick={handleMapClick}
                onLoad={onMapLoad}
                onUnmount={onUnmount}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  draggable: true,
                  scrollwheel: true,
                  gestureHandling: 'greedy', // Allows free panning and dragging
                  keyboardShortcuts: true,
                  clickableIcons: true,
                  restriction: undefined, // No map bounds restrictions - allow full world navigation
                  minZoom: 1, // Allow zooming out to see entire world
                  maxZoom: 20, // Allow zooming in for detailed view
                  styles: [
                    {
                      featureType: 'poi',
                      elementType: 'labels',
                      stylers: [{ visibility: 'on' }],
                    },
                  ],
                }}
              >
                {hasSelection && isLoaded && (
                  <Marker
                    position={{ lat: selectedLat!, lng: selectedLng! }}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30c0-11-9-20-20-20z" fill="#4285F4"/>
                          <circle cx="20" cy="20" r="8" fill="white"/>
                        </svg>
                      `),
                      scaledSize: new google.maps.Size(40, 50),
                      anchor: new google.maps.Point(20, 50),
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          </div>

          {hasSelection && (
            <div className="coordinates-display">
              <div className="coordinates-display-header">
                <div className="coordinates-header-icon">
                  <MapPin size={20} />
                </div>
                <div className="coordinates-header-content">
                  <h4 className="coordinates-display-title">Selected Location</h4>
                  <p className="coordinates-display-subtitle">Clinic coordinates</p>
                </div>
              </div>
              <div className="coordinates-display-content">
                <div className="coordinate-card">
                  <div className="coordinate-card-header">
                    <div className="coordinate-icon-wrapper latitude-icon">
                      <Navigation2 size={20} />
                    </div>
                    <div className="coordinate-label-content">
                      <span className="coordinate-label">Latitude</span>
                      <span className="coordinate-label-hint">North/South position</span>
                    </div>
                  </div>
                  <div className="coordinate-value-container">
                    <span className="coordinate-value">{selectedLat.toFixed(6)}</span>
                    <span className="coordinate-unit">°</span>
                  </div>
                </div>
                <div className="coordinate-card">
                  <div className="coordinate-card-header">
                    <div className="coordinate-icon-wrapper longitude-icon">
                      <ArrowLeftRight size={20} />
                    </div>
                    <div className="coordinate-label-content">
                      <span className="coordinate-label">Longitude</span>
                      <span className="coordinate-label-hint">East/West position</span>
                    </div>
                  </div>
                  <div className="coordinate-value-container">
                    <span className="coordinate-value">{selectedLng.toFixed(6)}</span>
                    <span className="coordinate-unit">°</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!hasSelection && (
            <div className="no-selection-hint">
              <MapPin size={16} />
              <span>No location selected. Please click on the map above to choose your clinic location.</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!hasSelection}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicLocationPickerModal;
