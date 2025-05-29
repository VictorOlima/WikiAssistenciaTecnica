# Wiki Assistência - Sistema de Documentação Técnica

Um sistema web moderno para gerenciamento e documentação de problemas técnicos, desenvolvido com React e Bootstrap. Ideal para assistências técnicas e profissionais que precisam documentar e compartilhar soluções.

## 👨‍💻 Autor

**Victor Lima**

- LinkedIn: [https://www.linkedin.com/in/victor-lima-301802181/]

## 🚀 Tecnologias Utilizadas

- **React 18.2.0** - Biblioteca principal para construção da interface
- **Bootstrap 5.3.2** - Framework CSS para design responsivo
- **React Router 6.20.0** - Gerenciamento de rotas
- **Axios 1.6.2** - Cliente HTTP para requisições
- **React Markdown 9.0.1** - Renderização de conteúdo em markdown
- **React Icons 4.12.0** - Biblioteca de ícones
- **React Bootstrap Typeahead 6.3.2** - Componente de autocompletar avançado

## 🗂️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/    # Componentes reutilizáveis
│   ├── pages/        # Páginas da aplicação
│   ├── App.js        # Componente principal
│   └── index.css     # Estilos globais
├── public/           # Arquivos públicos
└── package.json      # Dependências e scripts
```

## 💻 Requisitos

- Node.js 14 ou superior
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório:

```bash
git clone [URL_DO_REPOSITÓRIO]
```

2. Instale as dependências:

```bash
cd frontend
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:

- Crie um arquivo `.env` na pasta frontend (se não existir)
- Configure as variáveis necessárias:

```
REACT_APP_API_URL=sua_url_api
```

4. Inicie o projeto:

```bash
npm start
# ou
yarn start
```

A aplicação estará disponível em `http://localhost:3000`

## 📱 Recursos da Interface

- **Design Responsivo**: Interface adaptável para dispositivos móveis e desktop
- **Markdown Support**: Editor com suporte a formatação markdown
- **Preview em Tempo Real**: Visualização instantânea de documentos
- **Sistema de Tags**: Organização eficiente com autocompletar
- **Upload de Arquivos**: Suporte para imagens e documentos
- **Busca Avançada**: Filtros por categoria, tag e conteúdo

## 👥 Níveis de Acesso

### Administrador

- Gerenciamento completo do sistema
- Controle de usuários
- Gestão de categorias e tags

### Técnico

- Criação e edição de documentação
- Gestão dos próprios documentos
- Acesso a todas as documentações

### Usuário

- Visualização de documentação
- Busca e filtros
- Download de anexos

## 🔒 Segurança

- Autenticação JWT
- Validação de uploads
- Sanitização de inputs
- Proteção contra XSS
- Controle de acesso baseado em roles

## 📦 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm build` - Cria a versão de produção
- `npm test` - Executa os testes
- `npm eject` - Ejeta as configurações do Create React App

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Faça commit das mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📝 Notas de Versão

### v0.1.0

- Interface base com React e Bootstrap
- Sistema de autenticação
- CRUD de documentação
- Upload de arquivos
- Sistema de tags e categorias
