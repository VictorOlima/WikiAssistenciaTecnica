const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Problem, User, sequelize, Sequelize } = require('../models');
const config = require('../config');

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (config.ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Middleware para verificar autenticação
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
};

// Middleware para verificar permissões de edição
const canEdit = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const problem = await Problem.findByPk(req.params.id);
  if (!problem) {
    return res.status(404).json({ error: 'Problema não encontrado' });
  }

  if (req.user.role === 'admin' || problem.author_id === req.user.id) {
    req.problem = problem;
    return next();
  }

  res.status(403).json({ error: 'Acesso não autorizado' });
};

// Rota para obter todas as tags únicas
router.get('/tags', async (req, res) => {
  try {
    const problems = await Problem.findAll();
    const allTags = new Set();
    
    problems.forEach(problem => {
      const tags = problem.tags || [];
      tags.forEach(tag => allTags.add(tag.toLowerCase()));
    });

    const sortedTags = Array.from(allTags).sort();
    res.json(sortedTags);
  } catch (err) {
    console.error('Erro ao buscar tags:', err);
    res.status(500).json({ error: 'Erro ao buscar tags' });
  }
});

// Rota para obter todas as categorias únicas
router.get('/categories', async (req, res) => {
  try {
    const problems = await Problem.findAll();
    const categories = new Set();
    
    problems.forEach(problem => {
      if (problem.category) {
        categories.add(problem.category);
      }
    });

    res.json(Array.from(categories).sort());
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Listar problemas
router.get('/', async (req, res) => {
  try {
    const { tag, category } = req.query;
    let where = {};

    if (tag) {
      where.tags = { [Sequelize.Op.like]: `%${tag}%` };
    }
    if (category) {
      where.category = category;
    }

    const problems = await Problem.findAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['username'] }],
      order: [['created_at', 'DESC']]
    });

    res.json(problems);
  } catch (err) {
    console.error('Erro ao listar problemas:', err);
    res.status(500).json({ error: 'Erro ao listar problemas' });
  }
});

// Criar novo problema
router.post('/', isAuthenticated, upload.array('files'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'tecnico') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const { title, description, category, tags, youtubeLink } = req.body;

    if (!title || !description || !category || !tags) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const files = req.files ? req.files.map(file => path.join(config.UPLOAD_FOLDER, file.filename)) : [];

    const problem = await Problem.create({
      title,
      description,
      category,
      tags,
      files_json: files,
      youtubeLink,
      author_id: req.user.id
    });

    res.status(201).json(problem);
  } catch (err) {
    console.error('Erro ao criar problema:', err);
    res.status(500).json({ error: 'Erro ao criar problema' });
  }
});

// Obter problema específico
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findByPk(req.params.id, {
      include: [{ model: User, as: 'author', attributes: ['username'] }]
    });
    
    if (!problem) {
      return res.status(404).json({ error: 'Problema não encontrado' });
    }

    res.json(problem);
  } catch (err) {
    console.error('Erro ao buscar problema:', err);
    res.status(500).json({ error: 'Erro ao buscar problema' });
  }
});

// Atualizar problema
router.put('/:id', canEdit, upload.array('files'), async (req, res) => {
  try {
    const problem = req.problem;
    const { title, description, category, tags, youtubeLink, existing_files } = req.body;

    // Atualizar campos básicos
    if (title) problem.title = title;
    if (description) problem.description = description;
    if (category) problem.category = category;
    if (tags) problem.tags = tags;
    if (youtubeLink !== undefined) problem.youtubeLink = youtubeLink;

    // Gerenciar arquivos
    let currentFiles = [];

    // Processar arquivos existentes
    if (existing_files) {
      const existingFilesList = JSON.parse(existing_files);
      const currentFilesList = problem.files_json || [];
      const filesToRemove = currentFilesList.filter(f => !existingFilesList.includes(f));
      
      // Remover arquivos não mantidos
      for (const file of filesToRemove) {
        const fullPath = path.join(__dirname, '..', file);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      currentFiles = existingFilesList;
    } else {
      currentFiles = problem.files_json || [];
    }

    // Adicionar novos arquivos
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => path.join(config.UPLOAD_FOLDER, file.filename));
      currentFiles = currentFiles.concat(newFiles);
    }

    problem.files_json = currentFiles;
    await problem.save();

    res.json(problem);
  } catch (err) {
    console.error('Erro ao atualizar problema:', err);
    res.status(500).json({ error: 'Erro ao atualizar problema' });
  }
});

// Excluir problema
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const problem = await Problem.findByPk(req.params.id);
    if (!problem) {
      return res.status(404).json({ error: 'Problema não encontrado' });
    }

    // Garantir que files seja um array
    const files = problem.files_json || [];
    
    // Excluir arquivos associados
    for (const file of files) {
      const fullPath = path.join(__dirname, '..', file);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await problem.destroy();
    res.json({ message: 'Problema excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir problema:', err);
    res.status(500).json({ error: 'Erro ao excluir problema' });
  }
});

// Listar categorias
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Problem.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      raw: true
    });
    res.json(categories.map(c => c.category));
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Listar tags
router.get('/tags/list', async (req, res) => {
  try {
    const problems = await Problem.findAll({
      attributes: ['tags'],
      raw: true
    });

    const allTags = new Set();
    problems.forEach(problem => {
      const tags = problem.tags.split(',').map(tag => tag.trim());
      tags.forEach(tag => {
        if (tag) allTags.add(tag);
      });
    });

    res.json(Array.from(allTags));
  } catch (err) {
    console.error('Erro ao listar tags:', err);
    res.status(500).json({ error: 'Erro ao listar tags' });
  }
});

module.exports = router; 