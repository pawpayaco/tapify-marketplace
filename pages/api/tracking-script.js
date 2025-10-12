export default function handler(req, res) {
  // Set proper headers for JavaScript delivery
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache for 1 hour

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
      const email = urlParams.get('email');
      const retailerId = urlParams.get('retailer_id');

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

      // ✅ NEW: Capture email and retailer_id for Priority Display attribution
      if (email) {
        console.log('[Tapify] Captured retailer email:', email);
        sessionStorage.setItem('tapify_retailer_email', email);
        localStorage.setItem('tapify_retailer_email', email);
      }

      if (retailerId) {
        console.log('[Tapify] Captured retailer ID:', retailerId);
        sessionStorage.setItem('tapify_retailer_id', retailerId);
        localStorage.setItem('tapify_retailer_id', retailerId);
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

  // Global flag to prevent concurrent cart updates
  let isUpdatingCart = false;
  let updateQueue = [];

  // Add ref to cart as attribute (with queue to prevent race conditions)
  function addRefToCart() {
    const ref = getStoredRef();
    const retailerEmail = sessionStorage.getItem('tapify_retailer_email') || localStorage.getItem('tapify_retailer_email');
    const retailerId = sessionStorage.getItem('tapify_retailer_id') || localStorage.getItem('tapify_retailer_id');

    if (!ref && !retailerEmail && !retailerId) {
      console.log('[Tapify] No ref/email/retailer_id to add to cart');
      return Promise.resolve();
    }

    // If already updating, queue this request
    if (isUpdatingCart) {
      console.log('[Tapify] Cart update in progress, queuing request');
      return new Promise((resolve) => {
        updateQueue.push(resolve);
      });
    }

    isUpdatingCart = true;
    console.log('[Tapify] Adding attribution to cart attributes:', { ref, retailerEmail, retailerId });

    // Build cart attributes
    const attributes = {
      tapify_source: 'nfc_display'
    };

    if (ref) attributes.ref = ref;
    if (retailerEmail) attributes.retailer_email = retailerEmail;
    if (retailerId) attributes.retailer_id = retailerId;

    // Add as cart attribute (Shopify Ajax API)
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attributes: attributes
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Cart update failed');
      return response.json();
    })
    .then(data => {
      console.log('[Tapify] ✅ Successfully added ref to cart attributes');
      console.log('[Tapify] Cart attributes:', data.attributes);
      isUpdatingCart = false;

      // Process queued requests
      if (updateQueue.length > 0) {
        updateQueue.forEach(resolve => resolve());
        updateQueue = [];
      }

      return data;
    })
    .catch(error => {
      console.error('[Tapify] Failed to add ref to cart:', error);
      isUpdatingCart = false;

      // Reject queued requests
      if (updateQueue.length > 0) {
        updateQueue.forEach(resolve => resolve());
        updateQueue = [];
      }

      throw error;
    });
  }

  // Initialize tracking on page load
  function init() {
    // Capture ref/email/retailer_id if in URL
    captureRefParameter();

    const storedRef = getStoredRef();
    const retailerEmail = sessionStorage.getItem('tapify_retailer_email') || localStorage.getItem('tapify_retailer_email');
    const retailerId = sessionStorage.getItem('tapify_retailer_id') || localStorage.getItem('tapify_retailer_id');

    console.log('[Tapify] Init - Current URL:', window.location.href);
    console.log('[Tapify] Init - Stored attribution:', { ref: storedRef, email: retailerEmail, retailerId });
    console.log('[Tapify] Init - Already added flag:', sessionStorage.getItem('tapify_ref_added'));

    if (storedRef || retailerEmail || retailerId) {
      console.log('[Tapify] ✅ Attribution available - will be added to cart');

      // If we have attribution but haven't added it yet, try adding it now
      // This ensures attribution is added even if the user already has items in cart
      if (!sessionStorage.getItem('tapify_ref_added')) {
        console.log('[Tapify] Attempting to add attribution to existing cart...');
        setTimeout(() => {
          addRefToCart().then(() => {
            sessionStorage.setItem('tapify_ref_added', 'true');
            console.log('[Tapify] ✅ Attribution added to cart on page load');
          }).catch(err => {
            console.log('[Tapify] Could not add to cart on page load (cart may be empty):', err.message);
          });
        }, 1000); // Wait 1 second for page to fully load
      }
    } else {
      console.log('[Tapify] ⚠️ No attribution found - customer may have come directly (no ref/email/retailer_id)');
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
            const retailerEmail = sessionStorage.getItem('tapify_retailer_email') || localStorage.getItem('tapify_retailer_email');
            const retailerId = sessionStorage.getItem('tapify_retailer_id') || localStorage.getItem('tapify_retailer_id');

            if ((ref || retailerEmail || retailerId) && !sessionStorage.getItem('tapify_ref_added')) {
              console.log('[Tapify] Product being added to cart, will attach attribution');

              // Add ref immediately after cart add completes
              setTimeout(() => {
                addRefToCart().then(() => {
                  sessionStorage.setItem('tapify_ref_added', 'true');
                  console.log('[Tapify] Attribution added, checkout is now safe');
                }).catch(err => {
                  console.error('[Tapify] Failed to add attribution:', err);
                  sessionStorage.setItem('tapify_ref_added', 'true');
                });
              }, 300);
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
            const retailerEmail = sessionStorage.getItem('tapify_retailer_email') || localStorage.getItem('tapify_retailer_email');
            const retailerId = sessionStorage.getItem('tapify_retailer_id') || localStorage.getItem('tapify_retailer_id');

            if ((ref || retailerEmail || retailerId) && !sessionStorage.getItem('tapify_ref_added')) {
              console.log('[Tapify] Add-to-cart button clicked, will attach attribution');

              // Add attribution immediately after add-to-cart
              setTimeout(() => {
                addRefToCart().then(() => {
                  sessionStorage.setItem('tapify_ref_added', 'true');
                  console.log('[Tapify] Attribution added, checkout is now safe');
                }).catch(err => {
                  console.error('[Tapify] Failed to add attribution:', err);
                  sessionStorage.setItem('tapify_ref_added', 'true');
                });
              }, 300);
            }
          });
        });
      }

      // ✅ NEW: Intercept checkout button clicks to ensure attribution is set
      setupCheckoutInterceptor();
    } catch (err) {
      console.error('[Tapify] Error setting up cart hooks:', err);
    }
  }

  // Intercept checkout clicks to ensure cart attributes are set first
  function setupCheckoutInterceptor() {
    console.log('[Tapify] Setting up checkout interceptor');

    // Use capture phase to intercept before Shopify's handlers
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a[href*="/checkout"], button[name="checkout"], [data-action="checkout"]');

      if (target) {
        const ref = getStoredRef();
        const retailerEmail = sessionStorage.getItem('tapify_retailer_email') || localStorage.getItem('tapify_retailer_email');
        const retailerId = sessionStorage.getItem('tapify_retailer_id') || localStorage.getItem('tapify_retailer_id');

        // If we have attribution but haven't added it yet, block and add it first
        if ((ref || retailerEmail || retailerId) && !sessionStorage.getItem('tapify_ref_added')) {
          console.log('[Tapify] ⚠️ Checkout clicked before attribution added - blocking and adding now');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Add attribution BEFORE allowing checkout
          addRefToCart().then(() => {
            sessionStorage.setItem('tapify_ref_added', 'true');
            console.log('[Tapify] ✅ Attribution added, proceeding to checkout');

            // Now proceed to checkout
            if (target.tagName === 'A') {
              window.location.href = target.href;
            } else {
              target.click();
            }
          }).catch(err => {
            console.error('[Tapify] Failed to add attribution before checkout:', err);
            sessionStorage.setItem('tapify_ref_added', 'true');

            // Proceed anyway
            if (target.tagName === 'A') {
              window.location.href = target.href;
            } else {
              target.click();
            }
          });

          return false;
        }
      }
    }, true); // Use capture phase
  }

  // Start tracking
  init();
  setupCartHooks();

  console.log('[Tapify] Referral tracking initialized successfully');
})();
`;

  res.status(200).send(script);
}
