const MOCK_REWARDS_SUMMARY = {
  totalTVD: 100,
  currency: 'TVD',
};

const MOCK_REWARDS = [
  {
    id: 'reward-vote',
    title: 'Recompensa por votar',
    amount: 5,
    amountLabel: '+5 TVD',
    currency: 'TVD',
    status: 'received',
    statusLabel: 'Recibida',
    createdAtLabel: 'Hoy, 10:45',
    processName: 'Elecciones Universitarias',
    processLabel: 'Hoy, 10:45 · Elecciones Universitarias',
    type: 'Recompensa por votar',
    message: 'Recibiste esta recompensa por tu participación.',
  },
  {
    id: 'reward-welcome',
    title: 'Incentivo inicial',
    amount: 10,
    amountLabel: '+10 TVD',
    currency: 'TVD',
    status: 'received',
    statusLabel: 'Recibida',
    createdAtLabel: 'Ayer, 09:12',
    processName: 'Bienvenida a la plataforma',
    processLabel: 'Ayer, 09:12 · Bienvenida a la plataforma',
    type: 'Incentivo inicial',
    message: 'Recibiste esta recompensa por tu participación.',
  },
  {
    id: 'reward-registration',
    title: 'Recompensa por registro',
    amount: 3,
    amountLabel: '+3 TVD',
    currency: 'TVD',
    status: 'received',
    statusLabel: 'Recibida',
    createdAtLabel: '15 jun, 14:30',
    processName: 'Registro de usuario',
    processLabel: '15 jun, 14:30 · Registro de usuario',
    type: 'Recompensa por registro',
    message: 'Recibiste esta recompensa por tu participación.',
  },
];

export const getMockRewardsSummary = () => ({...MOCK_REWARDS_SUMMARY});

export const getMockRewards = () => MOCK_REWARDS.map(reward => ({...reward}));

export const getMockRewardById = id =>
  MOCK_REWARDS.find(reward => String(reward.id) === String(id)) || null;
