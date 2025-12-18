import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { X, MapPin, Search, Navigation, Crosshair, Navigation2, ArrowLeftRight } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ClinicLocationPickerModal.css';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ClinicLocationPickerModalProps {
  isOpen: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (latitude: number, longitude: number) => void;
  onCancel: () => void;
  onChange?: (latitude: number, longitude: number) => void; // Real-time updates as map cursor changes
}

// Component to handle map clicks and updates
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to handle map center changes
const MapCenterUpdater: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [center, zoom, map]);

  return null;
};

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
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Initialize coordinates when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // If initial coordinates exist, use them
    if (initialLatitude !== undefined && initialLongitude !== undefined) {
      setSelectedLat(initialLatitude);
      setSelectedLng(initialLongitude);
      setMarkerPosition([initialLatitude, initialLongitude]);
      // Update form values if onChange is provided
      if (onChange) {
        onChange(initialLatitude, initialLongitude);
      }
      return;
    }

    // Otherwise, try to get user's current location
    setIsGeolocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedLat(lat);
          setSelectedLng(lng);
          setMarkerPosition([lat, lng]);
          // Update form values in real-time
          if (onChange) {
            onChange(lat, lng);
          }
          setIsGeolocationLoading(false);
        },
        () => {
          // If geolocation fails, use a default center (Middle East region)
          const defaultLat = 31.9522;
          const defaultLng = 35.2332;
          setSelectedLat(defaultLat);
          setSelectedLng(defaultLng);
          setMarkerPosition([defaultLat, defaultLng]);
          // Update form values if onChange is provided
          if (onChange) {
            onChange(defaultLat, defaultLng);
          }
          setIsGeolocationLoading(false);
        }
      );
    } else {
      // Default to Middle East region if geolocation not available
      const defaultLat = 31.9522;
      const defaultLng = 35.2332;
      setSelectedLat(defaultLat);
      setSelectedLng(defaultLng);
      setMarkerPosition([defaultLat, defaultLng]);
      // Update form values if onChange is provided
      if (onChange) {
        onChange(defaultLat, defaultLng);
      }
      setIsGeolocationLoading(false);
    }
  }, [isOpen, initialLatitude, initialLongitude, onChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setMarkerPosition([lat, lng]);
    // Update form values in real-time
    if (onChange) {
      onChange(lat, lng);
    }
  }, [onChange]);

  const handleMarkerDragEnd = useCallback((e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setSelectedLat(position.lat);
    setSelectedLng(position.lng);
    setMarkerPosition([position.lat, position.lng]);
    // Update form values in real-time
    if (onChange) {
      onChange(position.lat, position.lng);
    }
  }, [onChange]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Doctor-Dashboard-App/1.0'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setSelectedLat(lat);
        setSelectedLng(lng);
        setMarkerPosition([lat, lng]);
        // Update form values in real-time
        if (onChange) {
          onChange(lat, lng);
        }
        setSearchQuery('');
      } else {
        setSearchError('Location not found. Please try a different search term.');
      }
    } catch (error) {
      setSearchError('Search failed. Please try again.');
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleCurrentLocation = useCallback(() => {
    setIsGeolocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedLat(lat);
          setSelectedLng(lng);
          setMarkerPosition([lat, lng]);
          // Update form values in real-time
          if (onChange) {
            onChange(lat, lng);
          }
          setIsGeolocationLoading(false);
        },
        () => {
          setSearchError('Unable to get your location. Please enable location services.');
          setIsGeolocationLoading(false);
        }
      );
    } else {
      setSearchError('Geolocation is not supported by your browser.');
      setIsGeolocationLoading(false);
    }
  }, [onChange]);

  const handleConfirm = () => {
    if (selectedLat !== null && selectedLng !== null) {
      onConfirm(selectedLat, selectedLng);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  if (!isOpen) return null;

  const mapCenter: [number, number] =
    markerPosition || (selectedLat !== null && selectedLng !== null
      ? [selectedLat, selectedLng]
      : [31.9522, 35.2332]); // Default center

  const hasSelection = selectedLat !== null && selectedLng !== null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
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

          {/* Search Bar */}
          <div className="map-search-container">
            <div className="map-search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
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
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchError(null);
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
            <div className="map-container">
              {!hasSelection && (
                <div className="map-overlay-instruction">
                  <Crosshair size={16} />
                  <span>Click on map to select location</span>
                </div>
              )}
              <MapContainer
                center={mapCenter}
                zoom={hasSelection ? 15 : 6}
                style={{ height: '600px', width: '100%', minHeight: '500px' }}
                scrollWheelZoom={true}
                zoomControl={true}
                ref={(map) => {
                  if (map) mapRef.current = map;
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markerPosition && (
                  <Marker
                    position={markerPosition}
                    draggable={true}
                    eventHandlers={{
                      dragend: handleMarkerDragEnd,
                    }}
                  />
                )}
                <MapClickHandler onMapClick={handleMapClick} />
                {markerPosition && (
                  <MapCenterUpdater center={markerPosition} zoom={hasSelection ? 15 : 6} />
                )}
              </MapContainer>
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
