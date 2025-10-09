-- ============================================================================
-- ESCOLA TCC - SCHEMA DO BANCO DE DADOS
-- ============================================================================

-- Criar banco de dados (execute separadamente no pgAdmin)
-- CREATE DATABASE escola_tcc;

-- Conectar ao banco escola_tcc e executar o resto do script

-- ============================================================================
-- TABELAS PRINCIPAIS
-- ============================================================================

-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'aluno' CHECK (role IN ('admin', 'professor', 'aluno', 'responsavel')),
    telefone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    avatar_url TEXT,
    informacoes_adicionais JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    ultimo_acesso TIMESTAMP
);

-- Tabela de sessões de usuário
CREATE TABLE sessoes_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Tabela de preferências do usuário
CREATE TABLE preferencias_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tema VARCHAR(20) DEFAULT 'light' CHECK (tema IN ('light', 'dark')),
    ja_viu_boas_vindas BOOLEAN DEFAULT FALSE,
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- ============================================================================
-- SISTEMA DE GAMIFICAÇÃO
-- ============================================================================

-- Tabela de pontuação e gamificação
CREATE TABLE gamificacao_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    pontos INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]',
    acoes JSONB DEFAULT '{}',
    ultima_visita DATE,
    streak_dias INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- Tabela de blocos visitados
CREATE TABLE blocos_visitados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    bloco_id VARCHAR(50) NOT NULL,
    visitado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, bloco_id)
);

-- ============================================================================
-- SISTEMA DE ATALHOS
-- ============================================================================

-- Tabela de atalhos disponíveis
CREATE TABLE atalhos_disponiveis (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    icone_url TEXT,
    url_destino TEXT,
    descricao TEXT,
    categoria VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de atalhos selecionados pelo usuário
CREATE TABLE atalhos_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    atalho_id INTEGER REFERENCES atalhos_disponiveis(id) ON DELETE CASCADE,
    posicao INTEGER NOT NULL CHECK (posicao BETWEEN 1 AND 6),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, posicao),
    UNIQUE(usuario_id, atalho_id)
);

-- ============================================================================
-- SISTEMA DE EVENTOS ESCOLARES
-- ============================================================================

-- Tabela de eventos escolares
CREATE TABLE eventos_escolares (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    tipo VARCHAR(50) DEFAULT 'evento' CHECK (tipo IN ('evento', 'prova', 'reuniao', 'feriado', 'atividade')),
    local VARCHAR(255),
    criado_por INTEGER REFERENCES usuarios(id),
    publico_alvo JSONB DEFAULT '[]', -- ['admin', 'professor', 'aluno', 'responsavel']
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SISTEMA DE LOGS E AUDITORIA
-- ============================================================================

-- Tabela de logs de atividade
CREATE TABLE logs_atividade (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT,
    ip_address INET,
    user_agent TEXT,
    dados_extras JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de permissões por role
CREATE TABLE permissoes_role (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permissao VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, permissao)
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_status ON usuarios(status);

-- Índices para sessões
CREATE INDEX idx_sessoes_token ON sessoes_usuario(token);
CREATE INDEX idx_sessoes_usuario_id ON sessoes_usuario(usuario_id);
CREATE INDEX idx_sessoes_expires ON sessoes_usuario(expires_at);

-- Índices para logs
CREATE INDEX idx_logs_usuario_id ON logs_atividade(usuario_id);
CREATE INDEX idx_logs_acao ON logs_atividade(acao);
CREATE INDEX idx_logs_created_at ON logs_atividade(created_at);

-- Índices para eventos
CREATE INDEX idx_eventos_data ON eventos_escolares(data_evento);
CREATE INDEX idx_eventos_tipo ON eventos_escolares(tipo);
CREATE INDEX idx_eventos_ativo ON eventos_escolares(ativo);

-- ============================================================================
-- DADOS INICIAIS (SEEDS)
-- ============================================================================

-- Inserir permissões padrão
INSERT INTO permissoes_role (role, permissao) VALUES
-- Admin
('admin', 'manage_users'),
('admin', 'view_logs'),
('admin', 'configure_system'),
('admin', 'full_access'),
('admin', 'manage_events'),
('admin', 'view_reports'),

-- Professor
('professor', 'view_tour'),
('professor', 'view_students'),
('professor', 'manage_activities'),
('professor', 'view_reports'),
('professor', 'create_events'),

-- Aluno
('aluno', 'view_tour'),
('aluno', 'use_shortcuts'),
('aluno', 'view_menu'),
('aluno', 'participate_gamification'),
('aluno', 'view_events'),

-- Responsável
('responsavel', 'view_tour'),
('responsavel', 'view_student_info'),
('responsavel', 'receive_notifications'),
('responsavel', 'view_reports'),
('responsavel', 'view_events');

-- Inserir atalhos disponíveis
INSERT INTO atalhos_disponiveis (nome, icone_url, url_destino, descricao, categoria, ordem) VALUES
('Mini Mapa', '../assets/imagens/mapa.png', 'tour.html', 'Navegação pelos blocos da escola', 'navegacao', 1),
('Lanchonetes', '../assets/imagens/lanchonetes.png', 'lanchonetes.html', 'Cardápio e pedidos das lanchonetes', 'servicos', 2),
('Biblioteca', '../assets/imagens/biblioteca.png', 'tour.html?bloco=Biblioteca', 'Acesso à biblioteca escolar', 'educacao', 3),
('Secretaria', '../assets/imagens/secretaria.png', '#', 'Informações da secretaria', 'administrativo', 4),
('Calendário', '../assets/imagens/calendario.png', '#', 'Eventos e calendário escolar', 'organizacao', 5),
('Notas', '../assets/imagens/notas.png', '#', 'Consulta de notas e boletim', 'educacao', 6);

-- Inserir usuário administrador padrão
INSERT INTO usuarios (nome, email, username, password_hash, role, telefone, status) VALUES
('Administrador', 'admin@escola.com', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '(11) 99999-9999', 'active');

-- Inserir preferências para o admin
INSERT INTO preferencias_usuario (usuario_id, tema, ja_viu_boas_vindas) VALUES
(1, 'light', FALSE);

-- Inserir gamificação para o admin
INSERT INTO gamificacao_usuario (usuario_id, pontos, nivel, badges, acoes) VALUES
(1, 0, 1, '[]', '{}');

-- Inserir alguns eventos de exemplo
INSERT INTO eventos_escolares (titulo, descricao, data_evento, tipo, publico_alvo, criado_por) VALUES
('Volta às Aulas', 'Início do ano letivo 2025', '2025-02-03', 'evento', '["admin", "professor", "aluno", "responsavel"]', 1),
('Reunião de Pais', 'Reunião bimestral com responsáveis', '2025-02-15', 'reuniao', '["responsavel", "professor"]', 1),
('Semana de Provas', 'Avaliações do 1º bimestre', '2025-03-20', 'prova', '["aluno", "professor"]', 1);

-- ============================================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferencias_updated_at BEFORE UPDATE ON preferencias_usuario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamificacao_updated_at BEFORE UPDATE ON gamificacao_usuario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos_escolares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View para usuários com informações completas
CREATE VIEW view_usuarios_completo AS
SELECT 
    u.id,
    u.nome,
    u.email,
    u.username,
    u.role,
    u.telefone,
    u.status,
    u.ultimo_acesso,
    p.tema,
    p.ja_viu_boas_vindas,
    g.pontos,
    g.nivel,
    g.badges,
    g.streak_dias
FROM usuarios u
LEFT JOIN preferencias_usuario p ON u.id = p.usuario_id
LEFT JOIN gamificacao_usuario g ON u.id = g.usuario_id;

-- View para eventos ativos
CREATE VIEW view_eventos_ativos AS
SELECT *
FROM eventos_escolares
WHERE ativo = TRUE
ORDER BY data_evento ASC;

COMMENT ON DATABASE escola_tcc IS 'Banco de dados do sistema de navegação escolar TCC';