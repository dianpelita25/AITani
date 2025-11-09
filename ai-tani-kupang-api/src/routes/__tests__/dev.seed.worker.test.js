import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seedAlertsFromFixtures } from '../../index';

const makeStmt = () => {
  const run = vi.fn().mockResolvedValue({});
  const bind = vi.fn().mockReturnValue({ run });
  return { bind, run };
};

describe('seedAlertsFromFixtures', () => {
  let deleteStmt;
  let insertStmt;
  let db;

  beforeEach(() => {
    deleteStmt = makeStmt();
    insertStmt = makeStmt();
    db = {
      prepare: vi.fn((sql) => {
        if (sql.startsWith('DELETE')) return deleteStmt;
        if (sql.startsWith('INSERT')) return insertStmt;
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
    };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-03T00:00:00Z'));
  });

  it('returns 0 when there are no fixtures', async () => {
    const inserted = await seedAlertsFromFixtures(db, [], 'acct', 'user');
    expect(inserted).toBe(0);
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('normalizes array/object fields before inserting', async () => {
    const fixtures = [
      {
        id: 'seed_alert_case_x',
        timestamp: '2025-01-02T10:00:00Z',
        pest_type: 'Ulat',
        severity: 'medium',
        description: 'Test alert',
        affected_crops: ['Jagung', 'Padi'],
        coordinates: { lat: -10.1, lng: 123.6 },
        photo_url: 'https://demo/Case%2520X.png',
        photo_key: null,
        affected_area: '1 Ha',
        pest_count: 20,
      },
    ];

    const inserted = await seedAlertsFromFixtures(db, fixtures, 'acct', 'user');

    expect(inserted).toBe(1);
    expect(deleteStmt.bind).toHaveBeenCalledWith('seed_alert_case_x', 'acct', 'user');
    expect(insertStmt.bind).toHaveBeenCalled();
    const args = insertStmt.bind.mock.calls[0];
    expect(args[0]).toBe('seed_alert_case_x');
    expect(args[5]).toBe(JSON.stringify(['Jagung', 'Padi']));
    expect(args[7]).toBe(JSON.stringify({ lat: -10.1, lng: 123.6 }));
    expect(args[9]).toBe('https://demo/Case%2520X.png');
  });

  it('fills defaults when fixture fields are missing', async () => {
    const fixtures = [{}];
    const inserted = await seedAlertsFromFixtures(db, fixtures, 'acct', 'user');
    expect(inserted).toBe(1);
    const args = insertStmt.bind.mock.calls[0];
    expect(args[2]).toBe('Hama');
    expect(args[3]).toBe('medium');
  });
});
