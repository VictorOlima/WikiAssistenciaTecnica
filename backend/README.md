# Backend da Wiki de Problemas Técnicos

Backend em Node.js para a Wiki de Problemas Técnicos.

## Requisitos

- Node.js 14+
- NPM ou Yarn

## Instalação

1. Instale as dependências:

```bash
npm install
# ou
yarn install
```

2. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
SECRET_KEY=sua-chave-secreta
DATABASE_URL=sqlite:wiki.db
NODE_ENV=development
```

3. Inicialize o banco de dados:

```bash
node init-db.js --criar-usuarios
```

## Executando o Servidor

Para desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

Para produção:

```bash
npm start
# ou
yarn start
```

O servidor estará disponível em `http://localhost:5000`.

## Configuração Inicial

Ao acessar o sistema pela primeira vez, caso não existam usuários, você será solicitado a criar um usuário administrador pela interface de login.

Alternativamente, você pode criar os usuários iniciais usando o comando interativo:

```bash
node init-db.js --criar-usuarios
```

## Níveis de Acesso

- **Administrador**: Acesso total. Pode criar, editar e excluir qualquer problema, além de gerenciar usuários.
- **Técnico**: Pode criar e editar seus próprios problemas.
- **Usuário comum**: Apenas visualiza problemas.

## Funcionalidades

- Login/Logout
- Listar problemas
- Filtrar por categoria
- Filtrar por tag
- Visualizar detalhes de um problema com arquivos anexados
- Criar novo problema (admin e técnico)
- Editar problema (admin e autor)
- Excluir problema (admin)
- Gerenciar usuários (admin)

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/register` - Registrar novo usuário (admin)

### Problemas

- `GET /api/problems` - Listar problemas
- `GET /api/problems/:id` - Obter problema específico
- `POST /api/problems` - Criar novo problema
- `PUT /api/problems/:id` - Atualizar problema
- `DELETE /api/problems/:id` - Excluir problema
- `GET /api/problems/categories/list` - Listar categorias
- `GET /api/problems/tags/list` - Listar tags

### Usuários

- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Obter usuário específico (admin)
- `PUT /api/users/:id` - Atualizar usuário (admin)
- `DELETE /api/users/:id` - Excluir usuário (admin)
