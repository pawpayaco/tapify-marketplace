/**
 * Trigger a Dwolla payout for a given payout job.
 * Wraps the `/api/payout` endpoint which performs admin checks server-side.
 */
export async function triggerPayout(payoutJobId) {
  const response = await fetch('/api/payout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payoutJobId }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error || 'Failed to process payout';
    throw new Error(message);
  }

  return payload;
}
