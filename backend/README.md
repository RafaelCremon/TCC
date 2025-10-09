# Backend - Sistema de Navegação Escolar TCC

Este é o backend completo para o sistema de navegação da escola, desenvolvido em Node.js com PostgreSQL.

## 🚀 Tecnologias Utilizadas

- **Node.js** - Ambiente de execução JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação por tokens
- **bcrypt** - Hash de senhas
- **express-validator** - Validação de dados
- **helmet** - Segurança HTTP
- **cors** - Cross-Origin Resource Sharing
- **morgan** - Logs de requisições
- **compression** - Compressão de respostas

## 📋 Funcionalidades

### Autenticação e Autorização
- Login/Logout com JWT
- Registro de usuários
- Controle de permissões por roles
- Sessões de usuário
- Logs de atividade

### Gerenciamento de Usuários
- CRUD completo de usuários
- Perfis de usuário (admin, professor, aluno, responsável)
- Atualização de dados pessoais
- Troca de senhas

### Sistema de Gamificação
- Pontos por atividades
- Sistema de níveis
- Badges e conquistas
- Ranking de usuários
- Streaks de atividade
- Histórico de visitas aos blocos

### Eventos Escolares
- Calendário de eventos
- CRUD de eventos
- Filtros por público-alvo
- Notificações
- Eventos futuros e histórico

### Atalhos Personalizados
- Seleção de atalhos favoritos
- Gerenciamento admin de atalhos
- Estatísticas de uso

### Preferências de Usuário
- Temas (claro/escuro)
- Configurações de notificação
- Estado de boas-vindas

### Logs e Auditoria
- Logs detalhados de atividades
- Relatórios de auditoria
- Alertas de segurança
- Estatísticas de uso

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- `usuarios` - Dados dos usuários
- `sessoes_usuario` - Sessões ativas
- `preferencias_usuario` - Configurações pessoais
- `gamificacao_usuario` - Dados de gamificação
- `eventos_escolares` - Calendário de eventos
- `atalhos_disponiveis` - Atalhos do sistema
- `atalhos_usuario` - Atalhos selecionados pelo usuário
- `logs_atividade` - Auditoria completa
- `blocos_visitas` - Histórico de visitas aos blocos

## 🛠️ Instalação e Configuração

### 1. Pré-requisitos
```bash
# Node.js 18+ e npm
node --version
npm --version

# PostgreSQL 12+
psql --version
```

### 2. Clone e instale dependências
```bash
git clone <url-do-repositorio>
cd backend
npm install
```

### 3. Configure o banco de dados PostgreSQL

#### Instalar PostgreSQL:
```bash
# Windows (usando Chocolatey)
choco install postgresql

# Ou baixe do site oficial: https://www.postgresql.org/download/windows/
```

#### Criar banco de dados:
```sql
-- Conecte no PostgreSQL como superuser
psql -U postgres

-- Criar banco de dados
CREATE DATABASE escola_tcc;

-- Criar usuário para a aplicação
CREATE USER escola_user WITH PASSWORD 'senha_segura_123';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE escola_tcc TO escola_user;

-- Conectar no banco criado
\c escola_tcc

-- Dar permissões no schema public
GRANT ALL ON SCHEMA public TO escola_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO escola_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO escola_user;
```

#### Executar schema:
```bash
# Executar o arquivo schema.sql
psql -U escola_user -d escola_tcc -f schema.sql
```

### 4. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do servidor
NODE_ENV=development
PORT=3000

# Configurações do banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=escola_tcc
DB_USER=escola_user
DB_PASSWORD=senha_segura_123

# Configurações JWT
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui_min_32_chars
JWT_EXPIRATION=24h

# Configurações de segurança
BCRYPT_ROUNDS=12

# Configurações CORS
FRONTEND_URL=http://localhost:8080

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de logs
LOG_FORMAT=combined
```

### 5. Executar a aplicação

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start

# Testar conexão
curl http://localhost:3000/api/health
```

## 📚 Documentação da API

### Endpoints de Autenticação

#### POST /api/auth/login
```json
{
  "username": "admin",
  "password": "123456"
}
```

#### POST /api/auth/register
```json
{
  "nome": "João Silva",
  "email": "joao@escola.com",
  "username": "joao.silva",
  "password": "senha123",
  "role": "aluno",
  "telefone": "(11) 99999-9999"
}
```

#### POST /api/auth/logout
```json
{
  "token": "jwt_token_here"
}
```

### Endpoints de Usuários

#### GET /api/users
Lista todos os usuários (admin only)

#### GET /api/users/profile
Busca perfil do usuário logado

#### PUT /api/users/profile
```json
{
  "nome": "João Santos",
  "email": "joao.santos@escola.com",
  "telefone": "(11) 88888-8888"
}
```

### Endpoints de Gamificação

#### GET /api/gamification/profile
Dados de gamificação do usuário

#### POST /api/gamification/action
```json
{
  "acao": "visita_bloco",
  "dados": {
    "bloco": "A",
    "andar": 1
  }
}
```

#### GET /api/gamification/ranking
Ranking geral de usuários

### Endpoints de Eventos

#### GET /api/events
Lista eventos do usuário

#### POST /api/events
```json
{
  "titulo": "Prova de Matemática",
  "descricao": "Prova do 1º bimestre",
  "data_evento": "2024-03-15",
  "hora_inicio": "14:00",
  "hora_fim": "16:00",
  "tipo": "prova",
  "local": "Sala 201 - Bloco A",
  "publico_alvo": ["aluno", "professor"]
}
```

### Endpoints de Atalhos

#### GET /api/shortcuts/user
Atalhos do usuário logado

#### POST /api/shortcuts/user/select
```json
{
  "atalhos": [
    {
      "atalho_id": 1,
      "posicao": 1
    },
    {
      "atalho_id": 3,
      "posicao": 2
    }
  ]
}
```

### Endpoints de Preferências

#### GET /api/preferences
Preferências do usuário

#### PUT /api/preferences
```json
{
  "tema": "dark",
  "ja_viu_boas_vindas": true,
  "notificacoes_ativas": true
}
```

### Endpoints de Logs (Admin Only)

#### GET /api/logs
Lista logs de atividade

#### GET /api/logs/admin/stats
Estatísticas de uso do sistema

## 🔒 Segurança

### Medidas Implementadas
- **JWT** para autenticação stateless
- **bcrypt** para hash de senhas
- **Helmet** para cabeçalhos de segurança
- **Rate Limiting** para prevenir ataques
- **CORS** configurado adequadamente
- **Validação** rigorosa de entrada
- **Logs** completos de auditoria
- **Permissões** baseadas em roles

### Headers de Segurança
- Content Security Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection

## 🧪 Testes

```bash
# Testar conexão com banco
node -e "require('./config/database').testConnection()"

# Testar servidor
curl http://localhost:3000/api/health

# Testar autenticação
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

## 📊 Monitoramento

### Logs do Sistema
- Todas as requisições HTTP são logadas
- Atividades dos usuários são registradas
- Erros são capturados e logados

### Health Check
```bash
GET /api/health
```

Retorna:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

## 🚀 Deploy em Produção

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
PORT=3000
DB_HOST=your_production_db_host
JWT_SECRET=your_very_secure_jwt_secret_here
FRONTEND_URL=https://your-frontend-domain.com
```

### PM2 (Recomendado)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 monit
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto é parte do TCC da Escola.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Consulte a documentação da API
3. Verifique a conexão com o banco de dados

## 🔄 Backup e Restauração

### Backup
```bash
pg_dump -U escola_user -h localhost escola_tcc > backup.sql
```

### Restauração
```bash
psql -U escola_user -h localhost escola_tcc < backup.sql
```