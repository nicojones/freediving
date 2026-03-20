import { describe, expect, it } from 'vitest';
import { buildSessionTimeline } from './buildSessionTimeline';

describe('buildSessionTimeline', () => {
  it('builds timeline with relaxation first', () => {
    const phases = [{ type: 'hold' as const, duration: 10 }];
    const timeline = buildSessionTimeline(phases);
    expect(timeline[0]).toEqual({ type: 'prepare', seconds: 60, label: 'Relaxation' });
  });
  it('adds hold items', () => {
    const phases = [
      { type: 'hold' as const, duration: 10 },
      { type: 'recovery' as const, duration: 20 },
      { type: 'hold' as const, duration: 15 },
    ];
    const timeline = buildSessionTimeline(phases);
    const holds = timeline.filter((t) => t.type === 'hold');
    expect(holds).toHaveLength(2);
    expect(holds[0]).toMatchObject({ seconds: 10, label: 'Static Apnea' });
    expect(holds[1]).toMatchObject({ seconds: 15, label: 'Static Apnea' });
  });
  it('marks isTargetPeak for longest hold when multiple holds', () => {
    const phases = [
      { type: 'hold' as const, duration: 10 },
      { type: 'recovery' as const, duration: 20 },
      { type: 'hold' as const, duration: 15 },
    ];
    const timeline = buildSessionTimeline(phases);
    const holds = timeline.filter((t) => t.type === 'hold');
    expect(holds[0].isTargetPeak).toBe(false);
    expect(holds[1].isTargetPeak).toBe(true);
  });
  it('adds recovery as prepare type', () => {
    const phases = [
      { type: 'hold' as const, duration: 10 },
      { type: 'recovery' as const, duration: 20 },
    ];
    const timeline = buildSessionTimeline(phases);
    const prepares = timeline.filter((t) => t.type === 'prepare');
    expect(prepares).toHaveLength(2);
    expect(prepares[1]).toEqual({ type: 'prepare', seconds: 20, label: 'Controlled Inhalation' });
  });
});
