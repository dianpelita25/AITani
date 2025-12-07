// ai-tani-kupang-api/tests/planner-fallback.test.mjs
import assert from 'assert';
import { runPlanner } from '../src/routes/diagnosis.js';

(async () => {
    const env = {};
    const finalResult = {
        diagnosis: {
            label: 'Contoh Penyakit',
            confidence: 70,
            severity: 'sedang',
            description: 'Contoh deskripsi.',
        },
        recommendations: [],
    };

    const planner = await runPlanner({ env, finalResult, meta: { crop_type: 'Jagung' } });


    assert.ok(planner, 'planner result should exist');
    assert.strictEqual(planner.source, 'planner-mock');
    assert.ok(planner.plan, 'planner.plan should exist');
    assert.ok(Array.isArray(planner.plan.phases), 'planner.plan.phases should be array');
    assert.ok(planner.plan.phases.length > 0, 'planner.plan.phases should not be empty');
})();

console.log('planner-fallback tests passed');
