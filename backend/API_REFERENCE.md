# 📚 API Reference - Sistema Escola TCC

## Base URL
```
http://localhost:3000/api
```

## Autenticação
Todas as rotas protegidas requerem o header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Autenticação (/auth)

### POST /auth/login
**Descrição:** Fazer login no sistema

**Body:**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**Resposta (200):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@escola.com",
    "username": "admin",
    "role": "admin"
  }
}
```

### POST /auth/register
**Descrição:** Registrar novo usuário

**Body:**
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

### POST /auth/logout
**Descrição:** Fazer logout

**Headers:** `Authorization: Bearer <token>`

### POST /auth/change-password
**Descrição:** Alterar senha

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "senha_atual": "senha_antiga",
  "nova_senha": "nova_senha"
}
```

### GET /auth/verify
**Descrição:** Verificar se token é válido

**Headers:** `Authorization: Bearer <token>`

---

## 👥 Usuários (/users)

### GET /users
**Descrição:** Listar usuários (admin only)

**Headers:** `Authorization: Bearer <token>`

**Query params:** `limite`, `pagina`, `role`, `status`

### GET /users/profile
**Descrição:** Buscar perfil do usuário logado

**Headers:** `Authorization: Bearer <token>`

### PUT /users/profile
**Descrição:** Atualizar perfil do usuário

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "nome": "João Santos",
  "email": "joao.santos@escola.com",
  "telefone": "(11) 88888-8888"
}
```

### GET /users/:id
**Descrição:** Buscar usuário por ID (admin only)

### PUT /users/:id
**Descrição:** Atualizar usuário (admin only)

### DELETE /users/:id
**Descrição:** Deletar usuário (admin only)

### GET /users/admin/stats
**Descrição:** Estatísticas de usuários (admin only)

---

## ⚙️ Preferências (/preferences)

### GET /preferences
**Descrição:** Buscar preferências do usuário

**Headers:** `Authorization: Bearer <token>`

**Resposta:**
```json
{
  "preferencias": {
    "tema": "claro",
    "ja_viu_boas_vindas": true,
    "notificacoes_ativas": true
  }
}
```

### PUT /preferences
**Descrição:** Atualizar preferências

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "tema": "escuro",
  "ja_viu_boas_vindas": true,
  "notificacoes_ativas": false
}
```

### POST /preferences/welcome-seen
**Descrição:** Marcar boas-vindas como vista

---

## 🎮 Gamificação (/gamification)

### GET /gamification/profile
**Descrição:** Dados de gamificação do usuário

**Headers:** `Authorization: Bearer <token>`

**Resposta:**
```json
{
  "gamificacao": {
    "pontos_totais": 150,
    "nivel": 2,
    "experiencia_atual": 50,
    "experiencia_proximo_nivel": 200,
    "streak_atual": 5,
    "maior_streak": 10,
    "badges": ["primeiro_login", "explorador"],
    "total_visitas": 25
  }
}
```

### POST /gamification/action
**Descrição:** Registrar ação para ganhar pontos

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "acao": "visita_bloco",
  "dados": {
    "bloco": "A",
    "andar": 1
  }
}
```

### GET /gamification/ranking
**Descrição:** Ranking de usuários

**Query params:** `limite`, `periodo`

### GET /gamification/badges
**Descrição:** Badges do usuário

### GET /gamification/visits
**Descrição:** Histórico de visitas aos blocos

---

## 🔗 Atalhos (/shortcuts)

### GET /shortcuts/available
**Descrição:** Atalhos disponíveis no sistema

**Resposta:**
```json
{
  "atalhos": [
    {
      "id": 1,
      "nome": "Portal do Aluno",
      "descricao": "Acesso ao portal acadêmico",
      "categoria": "academico",
      "url": "https://portal.escola.com",
      "icone": "graduation-cap",
      "cor": "#007bff"
    }
  ]
}
```

### GET /shortcuts/user
**Descrição:** Atalhos selecionados pelo usuário

**Headers:** `Authorization: Bearer <token>`

### POST /shortcuts/user/select
**Descrição:** Selecionar atalhos favoritos

**Headers:** `Authorization: Bearer <token>`

**Body:**
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

### POST /shortcuts/admin (admin only)
**Descrição:** Criar novo atalho

**Body:**
```json
{
  "nome": "Novo Atalho",
  "descricao": "Descrição do atalho",
  "categoria": "utilidades",
  "url": "https://exemplo.com",
  "icone": "link",
  "cor": "#28a745"
}
```

### GET /shortcuts/admin/stats
**Descrição:** Estatísticas de uso dos atalhos (admin only)

---

## 📅 Eventos (/events)

### GET /events
**Descrição:** Listar eventos do usuário

**Query params:** `limite`, `pagina`, `data_inicio`, `data_fim`, `tipo`, `mes_ano`

**Resposta:**
```json
{
  "eventos": [
    {
      "id": 1,
      "titulo": "Prova de Matemática",
      "descricao": "Prova do 1º bimestre",
      "data_evento": "2024-03-15T00:00:00.000Z",
      "hora_inicio": "14:00",
      "hora_fim": "16:00",
      "tipo": "prova",
      "local": "Sala 201 - Bloco A",
      "publico_alvo": ["aluno", "professor"]
    }
  ],
  "paginacao": {
    "pagina_atual": 1,
    "total_paginas": 1,
    "total_registros": 1,
    "registros_por_pagina": 50
  }
}
```

### GET /events/:id
**Descrição:** Buscar evento por ID

### POST /events
**Descrição:** Criar evento (permissão necessária)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "titulo": "Reunião de Pais",
  "descricao": "Reunião do 1º bimestre",
  "data_evento": "2024-03-20",
  "hora_inicio": "19:00",
  "hora_fim": "21:00",
  "tipo": "reuniao",
  "local": "Auditório",
  "publico_alvo": ["responsavel", "professor"]
}
```

### PUT /events/:id
**Descrição:** Atualizar evento

### DELETE /events/:id
**Descrição:** Deletar evento

### GET /events/calendario/:mes_ano
**Descrição:** Eventos do mês para calendário

**Exemplo:** `/events/calendario/2024-03`

### GET /events/proximos/lista
**Descrição:** Próximos eventos

### GET /events/admin/stats
**Descrição:** Estatísticas de eventos (admin only)

---

## 📋 Logs (/logs)

### GET /logs
**Descrição:** Listar logs de atividade (admin only)

**Headers:** `Authorization: Bearer <token>`

**Query params:** `limite`, `pagina`, `usuario_id`, `acao`, `data_inicio`, `data_fim`

### GET /logs/usuario/:id
**Descrição:** Logs de um usuário específico

### GET /logs/:id
**Descrição:** Buscar log por ID (admin only)

### GET /logs/admin/stats
**Descrição:** Estatísticas de logs

**Query params:** `periodo` (24h, 7d, 30d, 90d)

### GET /logs/admin/auditoria
**Descrição:** Relatório de auditoria

**Query params:** `data_inicio`, `data_fim`, `usuario_id`, `formato` (json, csv)

### DELETE /logs/admin/cleanup
**Descrição:** Limpeza de logs antigos (admin only)

**Body:**
```json
{
  "dias": 90
}
```

### GET /logs/seguranca/alertas
**Descrição:** Alertas de segurança (admin only)

---

## 🔍 Health Check

### GET /health
**Descrição:** Verificar status do servidor

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## 📊 Códigos de Status HTTP

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Dados inválidos
- **401** - Não autenticado
- **403** - Sem permissão
- **404** - Não encontrado
- **409** - Conflito (já existe)
- **429** - Muitas requisições
- **500** - Erro interno do servidor

---

## 🔑 Roles e Permissões

### Roles Disponíveis:
- **admin** - Acesso total ao sistema
- **professor** - Acesso a recursos educacionais
- **aluno** - Acesso a recursos estudantis
- **responsavel** - Acesso a informações do aluno

### Permissões por Role:

| Permissão | Admin | Professor | Aluno | Responsável |
|-----------|-------|-----------|-------|-------------|
| create_users | ✅ | ❌ | ❌ | ❌ |
| view_all_users | ✅ | ❌ | ❌ | ❌ |
| create_events | ✅ | ✅ | ❌ | ❌ |
| view_logs | ✅ | ❌ | ❌ | ❌ |
| manage_shortcuts | ✅ | ❌ | ❌ | ❌ |
| view_reports | ✅ | ✅ | ❌ | ❌ |

---

## 🚨 Rate Limiting

- **Limite:** 100 requisições por 15 minutos por IP
- **Headers de resposta:**
  - `X-RateLimit-Limit` - Limite total
  - `X-RateLimit-Remaining` - Requisições restantes
  - `X-RateLimit-Reset` - Timestamp do reset

---

## 🔧 Exemplos de Uso

### Login completo
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 2. Usar token nas próximas requisições
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar evento
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "titulo": "Prova de História",
    "descricao": "Prova sobre Segunda Guerra Mundial",
    "data_evento": "2024-03-25",
    "hora_inicio": "10:00",
    "hora_fim": "12:00",
    "tipo": "prova",
    "local": "Sala 105",
    "publico_alvo": ["aluno"]
  }'
```

### Registrar ação de gamificação
```bash
curl -X POST http://localhost:3000/api/gamification/action \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "acao": "visita_bloco",
    "dados": {
      "bloco": "A",
      "andar": 2
    }
  }'
```