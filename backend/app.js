const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const fs = require('fs');
const config = require('./config');
const db = require('./models');
const bcrypt = require('bcryptjs');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const app = express();

// Configuração inicial
app.set('trust proxy', 1);

// Configurar CORS primeiro
app.use(cors(config.CORS));

// Configurar body parser antes da sessão
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Criar cliente Redis com retry
let redisClient;
let redisReady = false;

async function setupRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          console.log(`Tentativa de reconexão Redis #${retries}`);
          if (retries > 10) {
            console.error('Não foi possível conectar ao Redis após 10 tentativas');
            return new Error('Limite de tentativas de reconexão excedido');
          }
          return Math.min(retries * 1000, 5000);
        },
        connectTimeout: 10000,
        keepAlive: 5000
      }
    });

    redisClient.on('error', (err) => {
      console.error('Erro Redis:', err);
      redisReady = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis conectando...');
    });

    redisClient.on('ready', () => {
      console.log('Redis conectado e pronto');
      redisReady = true;
    });

    redisClient.on('end', () => {
      console.log('Redis desconectado');
      redisReady = false;
    });

    await redisClient.connect();
  } catch (err) {
    console.error('Erro fatal ao conectar com Redis:', err);
    process.exit(1);
  }
}

// Iniciar conexão com Redis
setupRedis();

// Middleware para verificar Redis antes de processar sessão
app.use((req, res, next) => {
  if (!redisReady) {
    console.error('Redis não está pronto');
    return res.status(503).json({ error: 'Serviço temporariamente indisponível' });
  }
  next();
});

// Configurar middleware de sessão
const sessionMiddleware = session({
  store: new RedisStore({ 
    client: redisClient,
    prefix: 'wiki:sess:',
    disableTouch: false,
    ttl: 86400, // 1 dia em segundos
    onError: function(err) {
      console.error('Erro na sessão Redis:', err);
    }
  }),
  ...config.SESSION,
  name: 'wiki.sid',
  rolling: true,
  saveUninitialized: false,
  resave: false
});

app.use(sessionMiddleware);

// Configurar Passport APÓS a sessão
app.use(passport.initialize());
app.use(passport.session());

// Configurar estratégia local do Passport
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      return done(null, false, { message: 'Usuário não encontrado' });
    }
    const isValid = await user.checkPassword(password);
    if (!isValid) {
      return done(null, false, { message: 'Senha incorreta' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware para debug de sessão
app.use((req, res, next) => {
  const logInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated?.() || false,
    redisReady: redisReady,
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    }
  };
  console.log('Request Info:', JSON.stringify(logInfo, null, 2));
  next();
});

// Criar diretório de uploads se não existir
const uploadDir = path.join(__dirname, config.UPLOAD_FOLDER);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Importar e usar rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/users', require('./routes/users'));

// Rota de verificação de saúde com mais detalhes
app.get('/api/health', async (req, res) => {
  try {
    const healthCheck = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      redis: {
        status: redisReady ? 'connected' : 'disconnected',
        client: redisClient ? 'initialized' : 'not initialized'
      },
      database: {
        status: 'checking'
      }
    };

    // Verificar conexão com banco de dados
    try {
      await db.sequelize.authenticate();
      healthCheck.database.status = 'connected';
    } catch (dbError) {
      healthCheck.database.status = 'error';
      healthCheck.database.error = dbError.message;
    }

    // Verificar Redis com ping
    if (redisReady) {
      try {
        const pingResult = await redisClient.ping();
        healthCheck.redis.ping = pingResult;
      } catch (redisError) {
        healthCheck.redis.error = redisError.message;
      }
    }

    // Verificar sessão
    healthCheck.session = {
      configured: !!req.session,
      id: req.sessionID || 'not set',
      authenticated: req.isAuthenticated?.() || false
    };

    if (!redisReady || healthCheck.database.status !== 'connected') {
      res.status(503).json({
        status: 'unhealthy',
        ...healthCheck
      });
    } else {
      res.json({
        status: 'healthy',
        ...healthCheck
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Rota para verificar se o sistema já está configurado
app.get('/api/setup/status', async (req, res) => {
  try {
    const adminCount = await db.User.count({ where: { role: 'admin' } });
    res.json({
      isConfigured: adminCount > 0,
      message: adminCount > 0 ? 'Sistema já configurado' : 'Sistema necessita configuração inicial'
    });
  } catch (err) {
    console.error('Erro ao verificar status de configuração:', err);
    res.status(500).json({ 
      error: 'Erro interno',
      message: 'Não foi possível verificar o status de configuração'
    });
  }
});

// Rota de setup inicial
app.post('/api/setup', async (req, res) => {
  try {
    // Verificar se já existe algum usuário admin
    const adminCount = await db.User.count({ where: { role: 'admin' } });
    
    if (adminCount > 0) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Sistema já está configurado com um administrador'
      });
    }

    const { username, password } = req.body;
    
    // Validar dados de entrada
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        message: 'Nome de usuário e senha são obrigatórios'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'Nome de usuário deve ter pelo menos 3 caracteres'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Criar hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Criar usuário admin
    await db.User.create({
      username,
      password_hash,
      role: 'admin'
    });

    // Log de auditoria
    console.log(`Administrador inicial criado: ${username} em ${new Date().toISOString()}`);

    res.status(201).json({ 
      success: true,
      message: 'Administrador configurado com sucesso'
    });

  } catch (err) {
    console.error('Erro ao configurar admin:', err);
    
    // Verificar se é erro de usuário duplicado
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Conflito',
        message: 'Nome de usuário já existe'
      });
    }

    res.status(500).json({ 
      error: 'Erro interno',
      message: 'Não foi possível configurar o administrador'
    });
  }
});

// Servir arquivos estáticos do diretório de uploads
app.use('/api/files', express.static(uploadDir));

// Middleware global de tratamento de erros melhorado
app.use((err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    type: err.name,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  // Log detalhado do erro
  console.error('Erro na aplicação:', {
    ...errorDetails,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    },
    session: {
      id: req.sessionID,
      exists: !!req.session,
      authenticated: req.isAuthenticated?.()
    },
    redis: {
      ready: redisReady
    }
  });

  // Erros específicos
  if (err.name === 'SequelizeError' || err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Erro de validação no banco de dados',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.name === 'RedisError') {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    type: err.name,
    details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
  });
});

// Inicializar banco de dados e iniciar servidor
db.sequelize.sync().then(() => {
  app.listen(config.PORT, () => {
    console.log(`Servidor rodando na porta ${config.PORT}`);
    
    // Verificar se existe admin
    db.User.findOne({ where: { role: 'admin' } }).then(admin => {
      if (!admin) {
        console.log('='.repeat(80));
        console.log('ATENÇÃO: Nenhum administrador configurado.');
        console.log('Por favor, acesse /api/setup para criar o administrador inicial.');
        console.log('='.repeat(80));
      }
    });
  });
}); 