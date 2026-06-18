import { formatCurrency, formatDate, formatDateTime, formatNumber, getStatusClass, getInitials } from '../lib/utils';

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency(1234567.89)).toBe('1 234 567,89 DH');
  });

  it('formats negative amounts correctly', () => {
    expect(formatCurrency(-500.50)).toBe('- 500,50 DH');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('0,00 DH');
  });

  it('formats small amounts correctly', () => {
    expect(formatCurrency(0.99)).toBe('0,99 DH');
  });
});

describe('formatNumber', () => {
  it('formats positive numbers correctly', () => {
    expect(formatNumber(1234567.89)).toBe('1 234 567,89');
  });

  it('formats negative numbers correctly', () => {
    expect(formatNumber(-500.50)).toBe('- 500,50');
  });

  it('formats zero correctly', () => {
    expect(formatNumber(0)).toBe('0,00');
  });
});

describe('formatDate', () => {
  it('formats ISO date string correctly', () => {
    expect(formatDate('2024-01-15T00:00:00.000Z')).toBe('15/01/2024');
  });

  it('returns original string on invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatDateTime', () => {
  it('formats ISO date time string correctly', () => {
    const result = formatDateTime('2024-01-15T14:30:00.000Z');
    expect(result).toContain('15/01/2024');
    expect(result).toContain('14:30');
  });
});

describe('getStatusClass', () => {
  it('returns correct class for pending', () => {
    expect(getStatusClass('pending')).toBe('pending');
  });

  it('returns correct class for verified', () => {
    expect(getStatusClass('verified')).toBe('verified');
  });

  it('returns correct class for flagged', () => {
    expect(getStatusClass('flagged')).toBe('flagged');
  });

  it('returns pending for unknown status', () => {
    expect(getStatusClass('unknown')).toBe('pending');
  });

  it('handles uppercase status', () => {
    expect(getStatusClass('EXTRACTED')).toBe('pending');
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('Mustapha Atiq')).toBe('MA');
  });

  it('handles single name', () => {
    expect(getInitials('Mustapha')).toBe('M');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('Jean Claude Van Damme')).toBe('JC');
  });
});
