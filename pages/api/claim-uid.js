import { handleClaimRequest } from '../../lib/server/claimDisplay.js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  return handleClaimRequest(req, res);
}

