const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Acesso não autorizado' });
};

// Listar todos os usuários (apenas admin)
router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Obter usuário específico (apenas admin)
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar usuário (apenas admin)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { username, password, role } = req.body;

    if (username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: 'Nome de usuário já existe' });
      }
      user.username = username;
    }

    if (password) {
      await user.setPassword(password);
    }

    if (role) {
      if (!['admin', 'tecnico', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Papel inválido' });
      }
      user.role = role;
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Excluir usuário (apenas admin)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Não é possível excluir o último administrador' });
      }
    }

    await user.destroy();
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

module.exports = router; 