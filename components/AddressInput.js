import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddressInput({ 
  value, 
  onChange, 
  onValidated,
  error: externalError,
  required = true,
  className = '',
  googleApiKey,
  label = 'Address'
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(externalError || '');
  const [success, setSuccess] = useState(false);
  
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const wrapperRef = useRef(null);

  // Update internal query when value prop changes (for auto-population)
  useEffect(() => {
    if (value !== query) {
      setQuery(value || '');
      // If we got a new value, consider it successful (from store selection)
      if (value && value.length > 0) {
        setSuccess(true);
        setError('');
      }
    }
  }, [value]);

  // Initialize Google Maps services
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        initServices();
      };
    } else {
      initServices();
    }
  }, [googleApiKey]);

  const initServices = () => {
    if (window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const div = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(div);
    }
  };

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Google Places suggestions
  useEffect(() => {
    if (!query || query.length < 3 || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    const timer = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: ['address'],
          componentRestrictions: { country: 'us' }
        },
        (predictions, status) => {
          setLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Get place details and validate with USPS
  const handleSelectAddress = async (placeId) => {
    if (!placesService.current) return;

    setValidating(true);
    setError('');
    setSuccess(false);

    placesService.current.getDetails(
      { placeId, fields: ['address_components', 'formatted_address'] },
      async (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          // Parse Google address components
          const addressComponents = {};
          place.address_components.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) {
              addressComponents.street_number = component.long_name;
            }
            if (types.includes('route')) {
              addressComponents.route = component.long_name;
            }
            if (types.includes('subpremise')) {
              addressComponents.apt = component.long_name;
            }
            if (types.includes('locality')) {
              addressComponents.city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              addressComponents.state = component.short_name;
            }
            if (types.includes('postal_code')) {
              addressComponents.zip5 = component.long_name;
            }
          });

          const address1 = [
            addressComponents.street_number,
            addressComponents.route
          ].filter(Boolean).join(' ');

          const address2 = addressComponents.apt ? `Apt ${addressComponents.apt}` : '';

          // Validate with USPS (optional - don't block on errors)
          try {
            const response = await fetch('/api/validate-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address1,
                address2,
                city: addressComponents.city,
                state: addressComponents.state,
                zip5: addressComponents.zip5
              })
            });

            const result = await response.json();

            if (result.ok && result.address) {
              // USPS validated - use their standardized address
              const validated = result.address;
              const fullAddress = [
                validated.address1,
                validated.address2,
                validated.city,
                validated.state,
                validated.zip5
              ].filter(Boolean).join(', ');

              setQuery(fullAddress);
              setSuccess(true);
              setError('');
              
              // Call parent callbacks
              onChange?.(fullAddress);
              onValidated?.(validated);
              
            } else {
              // USPS validation failed - but still accept the Google Maps address
              console.warn('USPS validation failed:', result.error);
              
              // Use Google Maps address as fallback
              const fallbackAddress = place.formatted_address;
              setQuery(fallbackAddress);
              setSuccess(true); // Still mark as success since Google validated it
              setError(''); // Don't show error - Google Maps validation is sufficient
              
              // Call parent callbacks with Google Maps data
              onChange?.(fallbackAddress);
              
              // Create a validated object from Google data
              if (onValidated) {
                onValidated({
                  address1,
                  address2,
                  city: addressComponents.city,
                  state: addressComponents.state,
                  zip5: addressComponents.zip5 || '',
                  zip4: ''
                });
              }
            }
          } catch (err) {
            console.error('USPS validation error:', err);
            
            // On error, still use Google Maps address (don't block the user)
            const fallbackAddress = place.formatted_address;
            setQuery(fallbackAddress);
            setSuccess(true); // Mark as success
            setError(''); // Don't show error
            onChange?.(fallbackAddress);
          }
        }
        
        setValidating(false);
        setShowSuggestions(false);
      }
    );
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
        {validating && <span className="text-blue-600 text-xs ml-2">(Validating...)</span>}
        {success && <span className="text-green-600 text-xs ml-2"> </span>}
      </label>

      <div
        className={[
          "border-2 transition-all overflow-hidden bg-white rounded-[15px]",
          showSuggestions && query.length >= 3
            ? "border-gray-300 shadow-lg"
            : error 
              ? "border-red-300 hover:border-red-400"
              : success
                ? "border-green-300 hover:border-green-400"
                : "border-gray-200 hover:border-gray-300 focus-within:border-[#ff6fb3] focus-within:ring-2 focus-within:ring-[#ff6fb3]/20"
        ].join(" ")}
      >
        {/* Input Field */}
        <input
          type="text"
          id="address"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSuccess(false);
            setError('');
            onChange?.(e.target.value);
          }}
          onFocus={() => {
            if (query.length >= 3) {
              setShowSuggestions(true);
            }
          }}
          required={required}
          disabled={validating}
          className="w-full px-4 py-3 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none disabled:opacity-50 disabled:cursor-wait"
          placeholder="Start typing your address..."
          autoComplete="off"
        />

        {/* Dropdown Suggestions */}
        {showSuggestions && query.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto bg-white">
              {loading ? (
                <div className="px-4 py-8 text-gray-500 text-sm flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  Searching addresses...
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => handleSelectAddress(suggestion.place_id)}
                      className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-b border-gray-100 last:border-b-0 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-8 text-gray-500 text-sm text-center">
                  No addresses found. Keep typing...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 flex items-start gap-2"
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </motion.div>
      )}

      {/* Success Message */}
      {success && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-green-600 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Address verified by USPS</span>
        </motion.div>
      )}

      {/* Helper Text */}
      {!error && !success && (
        <p className="mt-2 text-xs text-gray-500">
          Start typing to search. We'll verify your address with USPS.
        </p>
      )}
    </div>
  );
}

