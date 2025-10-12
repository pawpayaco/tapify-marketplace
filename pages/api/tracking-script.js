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

  // Check if cart has items
  function checkCartHasItems() {
    return fetch('/cart.js')
      .then(r => r.json())
      .then(cart => cart.item_count > 0)
      .catch(() => false);
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
      console.log('[Tapify] ✅ Attribution available');

      // ✅ NEW APPROACH: Only add attribution immediately if cart already has items
      // This prevents race conditions with checkout
      if (!sessionStorage.getItem('tapify_ref_added')) {
        checkCartHasItems().then(hasItems => {
          if (hasItems) {
            console.log('[Tapify] Cart has items, adding attribution immediately');
            addRefToCart().then(() => {
              sessionStorage.setItem('tapify_ref_added', 'true');
              console.log('[Tapify] ✅ Attribution added to existing cart');
            }).catch(err => {
              console.log('[Tapify] Could not add attribution:', err.message);
            });
          } else {
            console.log('[Tapify] Cart is empty, will add attribution when item is added');
          }
        });
      }
    } else {
      console.log('[Tapify] ⚠️ No attribution found - customer may have come directly');
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

              // ✅ FIXED: Use Shopify's cart.add event instead of setTimeout
              // Wait for Shopify to finish adding the product, then add attribution
              document.addEventListener('cart:requestComplete', function addAttribution() {
                console.log('[Tapify] Cart updated, adding attribution now');
                addRefToCart().then(() => {
                  sessionStorage.setItem('tapify_ref_added', 'true');
                  console.log('[Tapify] ✅ Attribution added successfully');
                }).catch(err => {
                  console.error('[Tapify] Failed to add attribution:', err);
                });
                // Remove this one-time listener
                document.removeEventListener('cart:requestComplete', addAttribution);
              }, { once: true });
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

              // ✅ FIXED: Use Shopify's cart event instead of setTimeout
              document.addEventListener('cart:requestComplete', function addAttribution() {
                console.log('[Tapify] Cart updated, adding attribution now');
                addRefToCart().then(() => {
                  sessionStorage.setItem('tapify_ref_added', 'true');
                  console.log('[Tapify] ✅ Attribution added successfully');
                }).catch(err => {
                  console.error('[Tapify] Failed to add attribution:', err);
                });
                document.removeEventListener('cart:requestComplete', addAttribution);
              }, { once: true });
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

    let isProcessingCheckout = false;

    // Use capture phase to intercept before Shopify's handlers
    document.addEventListener('click', function checkoutHandler(e) {
      const target = e.target.closest('a[href*="/checkout"], button[name="checkout"], [data-action="checkout"], .cart__checkout, [name="checkout"]');

      if (target && !isProcessingCheckout) {
        const ref = getStoredRef();
        const retailerEmail = sessionStorage.getItem('tapify_retailer_email') || localStorage.getItem('tapify_retailer_email');
        const retailerId = sessionStorage.getItem('tapify_retailer_id') || localStorage.getItem('tapify_retailer_id');

        // If we have attribution but haven't added it yet, block and add it first
        if ((ref || retailerEmail || retailerId) && !sessionStorage.getItem('tapify_ref_added')) {
          console.log('[Tapify] ⚠️ Checkout clicked before attribution added - adding now');

          // ✅ CRITICAL FIX: Block the event completely
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          isProcessingCheckout = true;

          // Add attribution FIRST
          addRefToCart()
            .then(() => {
              sessionStorage.setItem('tapify_ref_added', 'true');
              console.log('[Tapify] ✅ Attribution added successfully');

              // ✅ FIX: Wait briefly for Shopify to process, then proceed
              return new Promise(resolve => setTimeout(resolve, 150));
            })
            .then(() => {
              console.log('[Tapify] Proceeding to checkout...');
              isProcessingCheckout = false;

              // ✅ FIX: Navigate directly to checkout URL (don't re-click)
              if (target.tagName === 'A' && target.href) {
                window.location.href = target.href;
              } else {
                // For forms/buttons, navigate to checkout directly
                window.location.href = '/checkout';
              }
            })
            .catch(err => {
              console.error('[Tapify] Failed to add attribution:', err);
              isProcessingCheckout = false;
              // Even if attribution fails, allow checkout
              window.location.href = '/checkout';
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
