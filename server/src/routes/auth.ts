import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { prisma } from '../config/database';
import config from '../config';
import { authMiddleware } from '../middleware/auth';
import { sendEmail } from '../services/email';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const userSelect = {
  id: true, email: true, fullName: true, role: true,
  firmName: true, title: true, phoneNumber: true, emailVerified: true,
  raisonSociale: true, clientICE: true, clientRC: true, formeJuridique: true,
  createdAt: true,
};

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, raisonSociale, clientICE, clientRC, formeJuridique, phoneNumber } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Champs obligatoires: email, password, fullName' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Cet email est déjà utilisé' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email, passwordHash, fullName, role: 'CLIENT',
        raisonSociale, clientICE, clientRC, formeJuridique, phoneNumber,
        verificationToken,
      },
      select: userSelect,
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (config.smtpHost) {
      const verifyUrl = `${config.appUrl}/verify-email?token=${verificationToken}`;
      sendEmail({
        to: email,
        subject: 'Confirmez votre inscription - Cabinet Laatig',
        html: `<p>Bonjour ${fullName},</p>
<p>Merci de vous être inscrit sur Cabinet Laatig.</p>
<p><a href="${verifyUrl}">Confirmer mon adresse email</a></p>
<p>Code de vérification : ${verificationToken}</p>`
      }).catch(() => {});
    }

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash, verificationToken, resetToken, resetTokenExpiry, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnexion réussie' });
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: userSelect,
    });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token requis' });
      return;
    }
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      res.status(400).json({ error: 'Token invalide' });
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });
    res.json({ message: 'Email vérifié avec succès' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Erreur de vérification' });
  }
});

router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
      return;
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });
    if (config.smtpHost) {
      const resetUrl = `${config.appUrl}/reset-password?token=${resetToken}`;
      sendEmail({
        to: email,
        subject: 'Réinitialisation de mot de passe - Cabinet Laatig',
        html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Ce lien expire dans 1 heure.</p>`
      }).catch(() => {});
    }
    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: 'Token et mot de passe requis' });
      return;
    }
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
    });
    if (!user) {
      res.status(400).json({ error: 'Token invalide ou expiré' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
