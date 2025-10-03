// pages/api/validate-address.js
// USPS Address Validation API

import { parseStringPromise } from 'xml2js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { address1, address2, city, state, zip5 } = req.body;

  // Validate required fields
  if (!address1 || !city || !state) {
    return res.status(400).json({ 
      ok: false, 
      error: 'Missing required fields: address1, city, and state are required' 
    });
  }

  const USPS_USERID = process.env.USPS_USERID;

  if (!USPS_USERID) {
    console.error('[validate-address] Missing USPS_USERID in environment');
    return res.status(500).json({ 
      ok: false, 
      error: 'Server configuration error' 
    });
  }

  try {
    // Build USPS XML request
    const xmlRequest = `
      <AddressValidateRequest USERID="${USPS_USERID}">
        <Revision>1</Revision>
        <Address ID="0">
          <Address1>${escapeXml(address2 || '')}</Address1>
          <Address2>${escapeXml(address1)}</Address2>
          <City>${escapeXml(city)}</City>
          <State>${escapeXml(state)}</State>
          <Zip5>${escapeXml(zip5 || '')}</Zip5>
          <Zip4></Zip4>
        </Address>
      </AddressValidateRequest>
    `.trim();

    console.log('[validate-address] Validating:', { address1, address2, city, state, zip5 });

    // Call USPS API
    const uspsUrl = `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML=${encodeURIComponent(xmlRequest)}`;
    
    const response = await fetch(uspsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/xml'
      }
    });

    const xmlResponse = await response.text();
    console.log('[validate-address] USPS Response:', xmlResponse);

    // Parse XML to JSON
    const result = await parseStringPromise(xmlResponse, { 
      explicitArray: false,
      mergeAttrs: true 
    });

    // Check for errors
    if (result.Error) {
      const errorMsg = result.Error.Description || 'Address validation failed';
      console.error('[validate-address] USPS Error:', errorMsg);
      
      // Handle authentication errors gracefully (don't expose to user)
      if (errorMsg.includes('Authorization') || errorMsg.includes('username') || errorMsg.includes('password')) {
        console.error('[validate-address] USPS authentication error - check USPS_USERID');
        // Return a generic error that won't block the user
        return res.status(400).json({ 
          ok: false, 
          error: 'Address validation service temporarily unavailable',
          rawError: 'USPS_AUTH_ERROR'
        });
      }
      
      // Provide helpful error messages for actual address issues
      let userMessage = errorMsg;
      if (errorMsg.includes('Invalid') || errorMsg.includes('not found')) {
        userMessage = 'Address not found. Please verify the street, city, and state.';
      } else if (errorMsg.includes('Apartment') || errorMsg.includes('Suite') || errorMsg.includes('Unit')) {
        userMessage = 'This address requires an apartment, suite, or unit number.';
      }
      
      return res.status(400).json({ 
        ok: false, 
        error: userMessage,
        rawError: errorMsg
      });
    }

    // Extract validated address
    const addressData = result.AddressValidateResponse?.Address;

    if (!addressData) {
      console.error('[validate-address] No address data in response');
      return res.status(400).json({ 
        ok: false, 
        error: 'Could not validate address' 
      });
    }

    // Check if USPS returned an error in the address node
    if (addressData.Error) {
      const errorMsg = addressData.Error.Description || 'Address validation failed';
      console.error('[validate-address] Address Error:', errorMsg);
      
      // Handle authentication errors gracefully
      if (errorMsg.includes('Authorization') || errorMsg.includes('username') || errorMsg.includes('password')) {
        console.error('[validate-address] USPS authentication error - check USPS_USERID');
        return res.status(400).json({ 
          ok: false, 
          error: 'Address validation service temporarily unavailable',
          rawError: 'USPS_AUTH_ERROR'
        });
      }
      
      let userMessage = errorMsg;
      if (errorMsg.includes('Apartment') || errorMsg.includes('Suite') || errorMsg.includes('Unit')) {
        userMessage = 'This address requires an apartment, suite, or unit number. Please add it and try again.';
      } else if (errorMsg.includes('Invalid') || errorMsg.includes('not found')) {
        userMessage = 'Address not deliverable. Please verify the address details.';
      }
      
      return res.status(400).json({ 
        ok: false, 
        error: userMessage,
        rawError: errorMsg
      });
    }

    // Build standardized address response
    const validatedAddress = {
      address1: addressData.Address2 || address1,
      address2: addressData.Address1 || address2 || '',
      city: addressData.City || city,
      state: addressData.State || state,
      zip5: addressData.Zip5 || zip5 || '',
      zip4: addressData.Zip4 || ''
    };

    console.log('[validate-address] Validated successfully:', validatedAddress);

    return res.status(200).json({
      ok: true,
      address: validatedAddress,
      message: 'Address validated successfully'
    });

  } catch (error) {
    console.error('[validate-address] Exception:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Address validation service error. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

