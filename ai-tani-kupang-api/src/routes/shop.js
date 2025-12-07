// ai-tani-kupang-api/src/routes/shop.js

import { json, getIdentity } from './utils';
import { runShopAssistant } from './diagnosis';

export async function handleShopEstimate(c) {
    const env = c.env;
    const request = c.req.raw;

    let identity = {};
    try {
        identity = getIdentity(c);
    } catch {
        identity = { accountId: 'anon', userId: 'anon' };
    }

    let body = {};
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400, env, request);
    }

    const diseaseName = (body.disease_name || body.diseaseName || '').trim();
    const activeIngredient = (body.active_ingredient || body.activeIngredient || '').trim();
    const location = body.location || null;
    const landSize = body.land_size || body.landSize || null;

    if (!activeIngredient) {
        return json({ error: 'active_ingredient wajib diisi' }, 400, env, request);
    }

    try {
        const result = await runShopAssistant({
            env,
            diseaseName,
            activeIngredient,
            location,
            landSize,
        });

        return json(
            {
                ...result,
                meta: {
                    disease_name: diseaseName || null,
                    active_ingredient: activeIngredient,
                    land_size: landSize || null,
                    location: location || null,
                    account_id: identity.accountId || null,
                    user_id: identity.userId || null,
                },
            },
            200,
            env,
            request
        );
    } catch (err) {
        console.warn('[handleShopEstimate] failed:', err?.message || err);
        return json({ error: 'shop_assistant_failed' }, 500, env, request);
    }
}
