import {
  getMockRewardById,
  getMockRewards,
  getMockRewardsSummary,
} from '../../../../src/features/rewards/data/mockRewards';

describe('mockRewards', () => {
  it('getMockRewardsSummary retorna 100 TVD', () => {
    expect(getMockRewardsSummary()).toEqual({
      totalTVD: 100,
      currency: 'TVD',
    });
  });

  it('getMockRewards retorna 3 recompensas con ids unicos y estado recibido', () => {
    const rewards = getMockRewards();
    const ids = rewards.map(reward => reward.id);

    expect(rewards).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(rewards.every(reward => reward.status === 'received')).toBe(true);
    expect(rewards.every(reward => reward.statusLabel === 'Recibida')).toBe(true);
  });

  it('mantiene montos mock esperados', () => {
    expect(getMockRewards().map(reward => reward.amount)).toEqual([5, 10, 3]);
  });

  it('getMockRewardById retorna recompensa correcta o null', () => {
    expect(getMockRewardById('reward-vote')?.title).toBe('Recompensa por votar');
    expect(getMockRewardById('reward-welcome')?.title).toBe('Incentivo inicial');
    expect(getMockRewardById('reward-registration')?.title).toBe('Recompensa por registro');
    expect(getMockRewardById('missing-reward')).toBeNull();
  });
});
