import { register, login } from '../controllers/auth';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../config', () => ({
  default: {
    jwtSecret: 'test-secret',
    isDev: true,
    smtpHost: '',
    appUrl: 'http://localhost:5173',
  },
}));
jest.mock('../services/email', () => ({
  sendEmail: jest.fn(),
}));

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: any = {}) {
  return {
    body: overrides.body || {},
    user: overrides.user,
    ...overrides,
  } as any;
}

describe('Auth Controller - register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user with valid data', async () => {
    const req = mockReq({
      body: {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      },
    });
    const res = mockRes();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'CLIENT',
      emailVerified: false,
      createdAt: new Date(),
    });
    (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' }),
        token: 'jwt-token',
      })
    );
  });

  it('should return 400 when required fields are missing', async () => {
    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it('should return 409 when email already exists', async () => {
    const req = mockReq({
      body: {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
      },
    });
    const res = mockRes();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Cet email est déjà utilisé' })
    );
  });
});

describe('Auth Controller - login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login with correct credentials', async () => {
    const req = mockReq({
      body: { email: 'test@example.com', password: 'password123' },
    });
    const res = mockRes();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'CLIENT',
      passwordHash: 'hashed-password',
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
      emailVerified: false,
      createdAt: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' }),
        token: 'jwt-token',
      })
    );
  });

  it('should return 401 with wrong password', async () => {
    const req = mockReq({
      body: { email: 'test@example.com', password: 'wrong-password' },
    });
    const res = mockRes();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Email ou mot de passe incorrect' })
    );
  });
});
