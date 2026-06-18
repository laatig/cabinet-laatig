import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import config from '../config';
import { sendEmail } from '../services/email';

const userSelect = {
  id: true, email: true, fullName: true, role: true,
  firmName: true, title: true, phoneNumber: true, emailVerified: true,
  raisonSociale: true, clientICE: true, clientRC: true, formeJuridique: true,
  createdAt: true,
};

export async function register(req: Request, res: Response): Promise<void> {
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
      }).catch((err: Error) => console.error('[Email] Failed to send:', err.message));
    }

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
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
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.json({ message: 'Déconnexion réussie' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
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
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Champs requis: currentPassword, newPassword' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
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
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
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
      }).catch((err: Error) => console.error('[Email] Failed to send reset:', err.message));
    }
    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
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
}
