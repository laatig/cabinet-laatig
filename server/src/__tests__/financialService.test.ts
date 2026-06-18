import { getBalance } from '../services/financialService';

const mockJournalEntryFindMany = jest.fn();
const mockTransactionFindMany = jest.fn();
const mockProjectFindUnique = jest.fn();

jest.mock('../config/database', () => ({
  prisma: {
    journalEntry: { findMany: (...args: any[]) => mockJournalEntryFindMany(...args) },
    transaction: { findMany: (...args: any[]) => mockTransactionFindMany(...args) },
    project: { findUnique: (...args: any[]) => mockProjectFindUnique(...args) },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getBalance', () => {
  const projectId = 'test-project-id';

  it('returns empty array when no entries exist', async () => {
    mockJournalEntryFindMany.mockResolvedValue([]);
    const result = await getBalance(projectId);
    expect(result).toEqual([]);
    expect(mockJournalEntryFindMany).toHaveBeenCalledWith({
      where: { projectId },
      include: { pcmAccount: true },
      orderBy: [{ accountNumber: 'asc' }, { date: 'asc' }],
    });
  });

  it('groups entries by account and computes debit/credit', async () => {
    mockJournalEntryFindMany.mockResolvedValue([
      {
        accountNumber: '5121',
        debit: 100000,
        credit: 0,
        pcmAccount: { accountName: 'Banque', classNumber: 5, className: 'Trésorerie' },
      },
      {
        accountNumber: '1011',
        debit: 0,
        credit: 500000,
        pcmAccount: { accountName: 'Capital social', classNumber: 1, className: 'Financement permanent' },
      },
    ]);

    const result = await getBalance(projectId);
    expect(result).toHaveLength(2);

    const banque = result.find(e => e.code === '5121');
    expect(banque).toBeDefined();
    expect(banque!.debit).toBe(100000);
    expect(banque!.credit).toBe(0);
    expect(banque!.soldeDebit).toBe(100000);
    expect(banque!.soldeCredit).toBe(0);

    const capital = result.find(e => e.code === '1011');
    expect(capital).toBeDefined();
    expect(capital!.debit).toBe(0);
    expect(capital!.credit).toBe(500000);
    expect(capital!.soldeDebit).toBe(0);
    expect(capital!.soldeCredit).toBe(500000);
  });

  it('aggregates multiple entries for the same account', async () => {
    mockJournalEntryFindMany.mockResolvedValue([
      {
        accountNumber: '5121',
        debit: 500000,
        credit: 0,
        pcmAccount: { accountName: 'Banque', classNumber: 5, className: 'Trésorerie' },
      },
      {
        accountNumber: '5121',
        debit: 0,
        credit: 72000,
        pcmAccount: { accountName: 'Banque', classNumber: 5, className: 'Trésorerie' },
      },
    ]);

    const result = await getBalance(projectId);
    expect(result).toHaveLength(1);

    const banque = result[0];
    expect(banque.debit).toBe(500000);
    expect(banque.credit).toBe(72000);
  });

  it('handles accounts without PCM association', async () => {
    mockJournalEntryFindMany.mockResolvedValue([
      {
        accountNumber: '9999',
        debit: 1000,
        credit: 0,
        pcmAccount: null,
      },
    ]);

    const result = await getBalance(projectId);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('9999');
    expect(result[0].classe).toBe('Classe 0');
  });
});
