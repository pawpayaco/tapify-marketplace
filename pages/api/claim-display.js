import { handleClaimRequest } from '../../lib/server/claimDisplay.js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  console.log('[API /api/claim-display] Handler invoked');
  console.log('[API /api/claim-display] Method:', req.method);
  console.log('[API /api/claim-display] URL:', req.url);

  try {
    return await handleClaimRequest(req, res);
  } catch (error) {
    console.error('[API /api/claim-display] Unhandled error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
}

