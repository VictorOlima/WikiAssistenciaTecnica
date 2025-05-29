require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const domain = isProd ? 'esk1.com.br' : 'localhost';
const protocol = isProd ? 'https://' : 'http://';

module.exports = {
  PORT: process.env.PORT || 5002,
  SECRET_KEY: process.env.SECRET_KEY || 'chave-secreta-padrao',
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite:wiki.db',
  UPLOAD_FOLDER: 'uploads',
  MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB máximo para uploads
  SESSION_LIFETIME: 24 * 60 * 60 * 1000, // 1 dia em milissegundos
  ALLOWED_EXTENSIONS: ['png', 'jpg', 'jpeg', 'gif', 'pdf'],
  
  // Configurações para sessão e cookies
  SESSION: {
    secret: process.env.SECRET_KEY || 'chave-secreta-padrao',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      domain: isProd ? '.esk1.com.br' : undefined,
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    }
  },

  // Configurações CORS
  CORS: {
    origin: isProd ? ['http://localhost:3002', 'http://localhost:3002'] : 'http://localhost:3002',
    credentials: true,
    exposedHeaders: ['set-cookie', 'Content-Disposition', 'Content-Type', 'Content-Length'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Content-Length', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
}; 