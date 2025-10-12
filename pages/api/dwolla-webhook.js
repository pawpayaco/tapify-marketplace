// /pages/api/dwolla-webhook.js
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, resourceId, _links } = req.body;

    console.log('[Dwolla Webhook]', { topic, resourceId });

    // Handle transfer failures
    if (topic === 'transfer_failed') {
      // Find payout_job with this transfer_id
      const { data: jobs } = await supabaseAdmin
        .from('payout_jobs')
        .select('id, transfer_ids')
        .contains('transfer_ids', [resourceId]);

      if (jobs && jobs.length > 0) {
        // Update payout job status to failed
        await supabaseAdmin
          .from('payout_jobs')
          .update({ status: 'failed' })
          .in('id', jobs.map(j => j.id));

        await logEvent('system', 'dwolla_transfer_failed', {
          transfer_id: resourceId,
          payout_job_ids: jobs.map(j => j.id)
        });

        console.log('[Dwolla Webhook] Marked payout jobs as failed:', jobs.map(j => j.id));
      }
    }

    // Handle transfer completion (optional - for reconciliation)
    if (topic === 'transfer_completed') {
      await logEvent('system', 'dwolla_transfer_completed', {
        transfer_id: resourceId
      });

      console.log('[Dwolla Webhook] Transfer completed:', resourceId);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Dwolla Webhook Error]', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
