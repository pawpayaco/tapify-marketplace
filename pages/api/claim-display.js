import { handleClaimRequest } from '../../lib/server/claimDisplay.js';

export default async function handler(req, res) {
  return handleClaimRequest(req, res);
}

