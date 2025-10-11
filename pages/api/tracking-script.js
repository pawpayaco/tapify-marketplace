export default function handler(req, res) {
  // Set proper headers for JavaScript delivery
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

  const script = `
/**
 * Tapify NFC Display Tracking Script
 * Captures ref parameter from URL and persists it through checkout
 */
(function() {
  console.log('[Tapify] Tracking script loaded v1.0');

  // Capture ref parameter from URL and store for cart attribution
  function captureRefParameter() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');

      if (ref) {
        console.log('[Tapify] Captured ref parameter:', ref);
        // Store in sessionStorage (persists across pages in same session)
        sessionStorage.setItem('tapify_ref', ref);
        // Also store in localStorage as backup (persists across sessions)
        localStorage.setItem('tapify_ref', ref);
        // Store timestamp to track when it was captured
        sessionStorage.setItem('tapify_ref_timestamp', Date.now());
        console.log('[Tapify] Ref stored successfully');
      }
    } catch (err) {
      console.error('[Tapify] Error capturing ref:', err);
    }
  }

  // Get stored ref parameter
  function getStoredRef() {
    try {
      return sessionStorage.getItem('tapify_ref') || localStorage.getItem('tapify_ref');
    } catch (err) {
      console.error('[Tapify] Error reading stored ref:', err);
      return null;
    }
  }

  // Add ref to cart as attribute
  function addRefToCart() {
    const ref = getStoredRef();
    if (!ref) {
      console.log('[Tapify] No ref parameter to add to cart');
      return;
    }

    console.log('[Tapify] Adding ref to cart attributes:', ref);

    // Add as cart attribute (Shopify Ajax API)
    fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attributes: {
          ref: ref,
          tapify_source: 'nfc_display'
        }
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Cart update failed');
      return response.json();
    })
    .then(data => {
      console.log('[Tapify] ✅ Successfully added ref to cart attributes');
      console.log('[Tapify] Cart attributes:', data.attributes);
    })
    .catch(error => {
      console.error('[Tapify] Failed to add ref to cart:', error);
    });
  }

  // Initialize tracking on page load
  function init() {
    // Capture ref if in URL
    captureRefParameter();

    // Add ref to cart if we have one stored
    const storedRef = getStoredRef();
    if (storedRef) {
      console.log('[Tapify] Found stored ref:', storedRef);

      // Add to cart immediately if on cart or checkout page
      if (window.location.pathname.includes('/cart') ||
          window.location.pathname.includes('/checkout')) {
        addRefToCart();
      }
    }
  }

  // Hook into add-to-cart events
  function setupCartHooks() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachCartListeners);
    } else {
      attachCartListeners();
    }
  }

  function attachCartListeners() {
    try {
      // Hook into add-to-cart forms
      const addToCartForms = document.querySelectorAll('form[action*="/cart/add"]');

      if (addToCartForms.length > 0) {
        console.log('[Tapify] Found', addToCartForms.length, 'add-to-cart forms');

        addToCartForms.forEach(form => {
          form.addEventListener('submit', function(e) {
            const ref = getStoredRef();
            if (ref) {
              console.log('[Tapify] Product being added to cart, will attach ref:', ref);
              // Wait a moment for cart to update, then add ref
              setTimeout(addRefToCart, 500);
            }
          });
        });
      }

      // Also hook into any AJAX add-to-cart buttons
      const addToCartButtons = document.querySelectorAll('[data-action="add-to-cart"], .add-to-cart, .product-form__submit');
      if (addToCartButtons.length > 0) {
        console.log('[Tapify] Found', addToCartButtons.length, 'add-to-cart buttons');

        addToCartButtons.forEach(button => {
          button.addEventListener('click', function(e) {
            const ref = getStoredRef();
            if (ref) {
              console.log('[Tapify] Add-to-cart button clicked, will attach ref:', ref);
              setTimeout(addRefToCart, 500);
            }
          });
        });
      }

      // On cart page, ensure ref is attached
      if (window.location.pathname.includes('/cart')) {
        const ref = getStoredRef();
        if (ref) {
          console.log('[Tapify] On cart page, attaching ref');
          addRefToCart();
        }
      }
    } catch (err) {
      console.error('[Tapify] Error setting up cart hooks:', err);
    }
  }

  // Start tracking
  init();
  setupCartHooks();

  console.log('[Tapify] Referral tracking initialized successfully');
})();
`;

  res.status(200).send(script);
}
