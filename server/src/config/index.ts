import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function loadConfig() {
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    jwtSecret: process.env.JWT_SECRET || (() => {
      if (!isDev) throw new Error('JWT_SECRET is required in production');
      return 'cabinet-laatig-jwt-secret-dev-only';
    })(),
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cabinet_laatig',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions',
    claudeApiKey: process.env.CLAUDE_API_KEY || '',
    claudeBaseUrl: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    emailFrom: process.env.EMAIL_FROM || 'noreply@cabinetlaatig.ma',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
  };
}

const config = loadConfig();
export default config;
