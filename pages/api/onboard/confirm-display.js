import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const {
    retailerId,
    shippingOption = 'standard',
    actorId = null
  } = req.body || {};

  if (!retailerId) {
    return res.status(400).json({ ok: false, error: 'Missing retailerId' });
  }

  const expressShipping = shippingOption === 'expedited';
  const onboardingStep = expressShipping ? 'priority_shipping_selected' : 'standard_shipping_selected';
  const displayStatus = expressShipping ? 'priority_queue' : 'standard_queue';
  const logAction = expressShipping
    ? 'retailer_shipping_priority_selected'
    : 'retailer_display_reserved_standard';

  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const retailerUpdate = await client.query(
      `UPDATE public.retailers
         SET express_shipping = $2,
             onboarding_completed = true,
             converted = true,
             converted_at = COALESCE(converted_at, now()),
             onboarding_step = $3
       WHERE id = $1
       RETURNING id`,
      [retailerId, expressShipping, onboardingStep]
    );

    if (retailerUpdate.rowCount === 0) {
      throw new Error('Retailer not found');
    }

    await client.query(
      `UPDATE public.displays
         SET status = $2
       WHERE retailer_id = $1`,
      [retailerId, displayStatus]
    );

    const metadata = {
      retailer_id: retailerId,
      shipping_option: shippingOption,
      actor_id: actorId
    };

    await client.query(
      `INSERT INTO public.logs (user_id, action, metadata, timestamp)
       VALUES ($1, $2, $3::jsonb, now())`,
      [`retailer:${retailerId}`, logAction, JSON.stringify(metadata)]
    );

    await client.query('COMMIT');

    return res.status(200).json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[confirm-display] Failed to update retailer shipping selection:', error);
    return res.status(500).json({ ok: false, error: error.message });
  } finally {
    client.release();
  }
}
