const express = require('express');
const passport = require('passport');
const router = express.Router();

// Middleware para verificar autenticação
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
};

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Acesso não autorizado' });
};

// Login
router.post('/login', (req, res, next) => {
  console.log('Tentativa de login:', { username: req.body.username });
  
  try {
    if (!req.body.username || !req.body.password) {
      console.log('Erro: Campos obrigatórios faltando');
      return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios' });
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Erro na autenticação:', err);
        return res.status(500).json({ error: 'Erro ao realizar login' });
      }
      if (!user) {
        console.log('Login falhou:', info.message);
        return res.status(401).json({ error: info.message || 'Usuário ou senha inválidos' });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Erro ao criar sessão:', err);
          return res.status(500).json({ error: 'Erro ao criar sessão' });
        }
        console.log('Login bem sucedido para:', user.username);
        return res.json({
          id: user.id,
          username: user.username,
          role: user.role
        });
      });
    })(req, res, next);
  } catch (err) {
    console.error('Erro inesperado no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    req.logout((err) => {
      if (err) {
        console.error('Erro ao fazer logout:', err);
        return res.status(500).json({ error: 'Erro ao fazer logout' });
      }
      res.json({ message: 'Logout realizado com sucesso' });
    });
  } catch (err) {
    console.error('Erro inesperado no logout:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar usuário atual
router.get('/me', (req, res) => {
  try {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Não autenticado' });
    }
  } catch (err) {
    console.error('Erro ao verificar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registrar novo usuário (apenas admin)
router.post('/register', isAdmin, async (req, res) => {
  const { User } = require('../models');
  const { username, password, role } = req.body;

  try {
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (!['admin', 'tecnico', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Papel inválido' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Nome de usuário já existe' });
    }

    // Gerar o hash da senha primeiro
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // Criar o usuário com todos os dados necessários
    const user = await User.create({
      username,
      role,
      password_hash
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

module.exports = router; 