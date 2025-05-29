const readline = require('readline');
const db = require('./models');
const { User } = db;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function initDb(criarUsuarios = false) {
  try {
    // Sincronizar modelos com o banco de dados
    await db.sequelize.sync();
    console.log('Banco de dados sincronizado');

    // Verificar se já existe um usuário admin
    const admin = await User.findOne({ where: { role: 'admin' } });

    if (!admin && criarUsuarios) {
      console.log('Criando usuário administrador');
      const adminPassword = await question('Digite a senha do administrador: ');

      const admin = await User.create({ username: 'admin', role: 'admin' });
      await admin.setPassword(adminPassword);
      await admin.save();

      const criarTecnico = (await question('Criar usuário técnico? (s/n): ')).toLowerCase() === 's';
      if (criarTecnico) {
        const tecnicoPassword = await question('Digite a senha do técnico: ');
        const tecnico = await User.create({ username: 'tecnico', role: 'tecnico' });
        await tecnico.setPassword(tecnicoPassword);
        await tecnico.save();
      }

      const criarUsuario = (await question('Criar usuário comum? (s/n): ')).toLowerCase() === 's';
      if (criarUsuario) {
        const usuarioPassword = await question('Digite a senha do usuário comum: ');
        const usuario = await User.create({ username: 'usuario', role: 'user' });
        await usuario.setPassword(usuarioPassword);
        await usuario.save();
      }

      console.log('Banco de dados inicializado com sucesso.');
    } else if (!admin) {
      console.log('Banco de dados inicializado sem usuários.');
      console.log('Use o endpoint /api/setup para criar o administrador.');
    } else {
      console.log('Banco de dados já inicializado com usuários.');
    }
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
  } finally {
    rl.close();
    process.exit();
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);
const criarUsuarios = args.includes('--criar-usuarios');

initDb(criarUsuarios); 