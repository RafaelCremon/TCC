-- ============================================================================
-- SCHEMA DO BANCO DE DADOS - SISTEMA ESCOLA TCC
-- ============================================================================
-- PostgreSQL 12+
-- Criado em: 2024
-- 
-- INSTRUÇÕES:
-- 1. Conecte no pgAdmin como usuário postgres
-- 2. Crie o banco: escola_tcc
-- 3. Crie o usuário: escola_user
-- 4. Execute este script no banco escola_tcc
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELA DE USUÁRIOS
-- ============================================================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'aluno' CHECK (role IN ('admin', 'professor', 'aluno', 'responsavel')),
    telefone VARCHAR(20),
    data_nascimento DATE,
    foto_perfil TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    ultimo_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_status ON usuarios(status);

-- ============================================================================
-- TABELA DE SESSÕES DE USUÁRIO
-- ============================================================================

CREATE TABLE sessoes_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sessoes_usuario_id ON sessoes_usuario(usuario_id);
CREATE INDEX idx_sessoes_token ON sessoes_usuario(token_hash);
CREATE INDEX idx_sessoes_expires ON sessoes_usuario(expires_at);

-- ============================================================================
-- TABELA DE PREFERÊNCIAS DO USUÁRIO
-- ============================================================================

CREATE TABLE preferencias_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tema VARCHAR(20) DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro')),
    ja_viu_boas_vindas BOOLEAN DEFAULT FALSE,
    notificacoes_ativas BOOLEAN DEFAULT TRUE,
    idioma VARCHAR(10) DEFAULT 'pt-BR',
    configuracoes_extras JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- ============================================================================
-- TABELA DE GAMIFICAÇÃO
-- ============================================================================

CREATE TABLE gamificacao_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    pontos_totais INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    experiencia_atual INTEGER DEFAULT 0,
    streak_atual INTEGER DEFAULT 0,
    maior_streak INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]',
    total_visitas INTEGER DEFAULT 0,
    ultima_atividade TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- Índices
CREATE INDEX idx_gamificacao_usuario_id ON gamificacao_usuario(usuario_id);
CREATE INDEX idx_gamificacao_pontos ON gamificacao_usuario(pontos_totais);
CREATE INDEX idx_gamificacao_nivel ON gamificacao_usuario(nivel);

-- ============================================================================
-- TABELA DE ATALHOS DISPONÍVEIS
-- ============================================================================

CREATE TABLE atalhos_disponiveis (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    icone VARCHAR(100),
    cor VARCHAR(7) DEFAULT '#007bff',
    ativo BOOLEAN DEFAULT TRUE,
    publico_alvo JSONB DEFAULT '["admin", "professor", "aluno", "responsavel"]',
    ordem_exibicao INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_atalhos_categoria ON atalhos_disponiveis(categoria);
CREATE INDEX idx_atalhos_ativo ON atalhos_disponiveis(ativo);

-- ============================================================================
-- TABELA DE ATALHOS DO USUÁRIO
-- ============================================================================

CREATE TABLE atalhos_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    atalho_id INTEGER NOT NULL REFERENCES atalhos_disponiveis(id) ON DELETE CASCADE,
    posicao INTEGER NOT NULL CHECK (posicao >= 1 AND posicao <= 6),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, atalho_id),
    UNIQUE(usuario_id, posicao)
);

-- Índices
CREATE INDEX idx_atalhos_usuario_id ON atalhos_usuario(usuario_id);
CREATE INDEX idx_atalhos_posicao ON atalhos_usuario(posicao);

-- ============================================================================
-- TABELA DE EVENTOS ESCOLARES
-- ============================================================================

CREATE TABLE eventos_escolares (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    tipo VARCHAR(50) DEFAULT 'evento' CHECK (tipo IN ('evento', 'prova', 'reuniao', 'feriado', 'atividade')),
    local VARCHAR(255),
    publico_alvo JSONB DEFAULT '["admin", "professor", "aluno", "responsavel"]',
    criado_por INTEGER REFERENCES usuarios(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_eventos_data ON eventos_escolares(data_evento);
CREATE INDEX idx_eventos_tipo ON eventos_escolares(tipo);
CREATE INDEX idx_eventos_ativo ON eventos_escolares(ativo);
CREATE INDEX idx_eventos_criado_por ON eventos_escolares(criado_por);

-- ============================================================================
-- TABELA DE LOGS DE ATIVIDADE
-- ============================================================================

CREATE TABLE logs_atividade (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    metodo_http VARCHAR(10),
    dados_alterados JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance em consultas de logs
CREATE INDEX idx_logs_usuario_id ON logs_atividade(usuario_id);
CREATE INDEX idx_logs_acao ON logs_atividade(acao);
CREATE INDEX idx_logs_timestamp ON logs_atividade(timestamp);
CREATE INDEX idx_logs_endpoint ON logs_atividade(endpoint);

-- Particionamento por mês para logs (opcional, para grandes volumes)
-- CREATE INDEX idx_logs_timestamp_month ON logs_atividade(DATE_TRUNC('month', timestamp));

-- ============================================================================
-- TABELA DE HISTÓRICO DE VISITAS AOS BLOCOS
-- ============================================================================

CREATE TABLE blocos_visitas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    bloco VARCHAR(10) NOT NULL,
    andar INTEGER,
    local_especifico VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pontos_ganhos INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX idx_blocos_usuario_id ON blocos_visitas(usuario_id);
CREATE INDEX idx_blocos_bloco ON blocos_visitas(bloco);
CREATE INDEX idx_blocos_timestamp ON blocos_visitas(timestamp);

-- ============================================================================
-- TABELA DE CONFIGURAÇÕES DO SISTEMA
-- ============================================================================

CREATE TABLE configuracoes_sistema (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    categoria VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS PARA ATUALIZAR TIMESTAMPS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferencias_updated_at BEFORE UPDATE ON preferencias_usuario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamificacao_updated_at BEFORE UPDATE ON gamificacao_usuario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atalhos_updated_at BEFORE UPDATE ON atalhos_disponiveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos_escolares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View para ranking de usuários
CREATE VIEW ranking_usuarios AS
SELECT 
    u.id,
    u.nome,
    u.role,
    g.pontos_totais,
    g.nivel,
    g.maior_streak,
    g.total_visitas,
    RANK() OVER (ORDER BY g.pontos_totais DESC) as posicao_ranking
FROM usuarios u
JOIN gamificacao_usuario g ON u.id = g.usuario_id
WHERE u.status = 'active'
ORDER BY g.pontos_totais DESC;

-- View para estatísticas gerais
CREATE VIEW estatisticas_sistema AS
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE status = 'active') as usuarios_ativos,
    (SELECT COUNT(*) FROM eventos_escolares WHERE ativo = true AND data_evento >= CURRENT_DATE) as eventos_futuros,
    (SELECT COUNT(*) FROM logs_atividade WHERE timestamp >= CURRENT_DATE) as atividades_hoje,
    (SELECT AVG(pontos_totais) FROM gamificacao_usuario) as media_pontos,
    (SELECT COUNT(*) FROM sessoes_usuario WHERE expires_at > NOW()) as sessoes_ativas;

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Usuário administrador padrão
INSERT INTO usuarios (nome, email, username, senha_hash, role) 
VALUES ('Administrador', 'admin@escola.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewH.Z6A3/C9QJ9NK', 'admin');

-- Configurações iniciais de gamificação para o admin
INSERT INTO gamificacao_usuario (usuario_id) VALUES (1);

-- Preferências iniciais para o admin
INSERT INTO preferencias_usuario (usuario_id) VALUES (1);

-- Atalhos padrão do sistema
INSERT INTO atalhos_disponiveis (nome, descricao, categoria, url, icone, cor, ordem_exibicao) VALUES
('Portal do Aluno', 'Acesso ao sistema acadêmico', 'academico', 'https://portal.escola.com', 'graduation-cap', '#007bff', 1),
('Biblioteca Digital', 'Acervo digital da biblioteca', 'academico', 'https://biblioteca.escola.com', 'book', '#28a745', 2),
('Calendário Escolar', 'Eventos e datas importantes', 'utilidades', '#', 'calendar', '#dc3545', 3),
('Cardápio da Semana', 'Cardápio da cantina', 'alimentacao', '#', 'utensils', '#ffc107', 4),
('Mapa da Escola', 'Navegação pelos blocos', 'navegacao', '#', 'map', '#17a2b8', 5),
('Contatos Importantes', 'Telefones e emails', 'utilidades', '#', 'phone', '#6f42c1', 6),
('Área do Professor', 'Recursos pedagógicos', 'academico', 'https://professor.escola.com', 'chalkboard-teacher', '#fd7e14', 7),
('Secretaria Online', 'Serviços da secretaria', 'administrativo', 'https://secretaria.escola.com', 'file-alt', '#20c997', 8);

-- Configurações do sistema
INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, categoria) VALUES
('pontos_login_diario', '10', 'Pontos ganhos no primeiro login do dia', 'number', 'gamificacao'),
('pontos_visita_bloco', '5', 'Pontos ganhos por visita a um bloco', 'number', 'gamificacao'),
('pontos_streak_bonus', '20', 'Bonus por manter streak de 7 dias', 'number', 'gamificacao'),
('exp_por_nivel', '100', 'Experiência base necessária por nível', 'number', 'gamificacao'),
('max_atalhos_usuario', '6', 'Máximo de atalhos por usuário', 'number', 'interface'),
('versao_sistema', '1.0.0', 'Versão atual do sistema', 'string', 'sistema'),
('manutencao', 'false', 'Sistema em manutenção', 'boolean', 'sistema');

-- Eventos de exemplo
INSERT INTO eventos_escolares (titulo, descricao, data_evento, hora_inicio, hora_fim, tipo, local, publico_alvo, criado_por) VALUES
('Reunião de Pais - 1º Bimestre', 'Apresentação das notas e desenvolvimento dos alunos', '2024-04-15', '19:00', '21:00', 'reuniao', 'Auditório Principal', '["responsavel", "professor"]', 1),
('Feira de Ciências', 'Exposição dos projetos científicos dos alunos', '2024-05-20', '14:00', '17:00', 'evento', 'Pátio Central', '["aluno", "professor", "responsavel"]', 1),
('Prova de Matemática - 9º Ano', 'Avaliação do 1º bimestre', '2024-03-25', '14:00', '16:00', 'prova', 'Salas 201-210', '["aluno", "professor"]', 1);

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para calcular nível baseado na experiência
CREATE OR REPLACE FUNCTION calcular_nivel(experiencia INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(experiencia / 100) + 1;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas()
RETURNS INTEGER AS $$
DECLARE
    sessoes_removidas INTEGER;
BEGIN
    DELETE FROM sessoes_usuario WHERE expires_at < NOW();
    GET DIAGNOSTICS sessoes_removidas = ROW_COUNT;
    RETURN sessoes_removidas;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas de gamificação
CREATE OR REPLACE FUNCTION atualizar_gamificacao(p_usuario_id INTEGER, p_pontos INTEGER, p_acao VARCHAR)
RETURNS VOID AS $$
DECLARE
    nivel_atual INTEGER;
    novo_nivel INTEGER;
BEGIN
    -- Atualizar pontos
    UPDATE gamificacao_usuario 
    SET 
        pontos_totais = pontos_totais + p_pontos,
        ultima_atividade = NOW()
    WHERE usuario_id = p_usuario_id;
    
    -- Calcular novo nível
    SELECT pontos_totais INTO nivel_atual FROM gamificacao_usuario WHERE usuario_id = p_usuario_id;
    novo_nivel := calcular_nivel(nivel_atual);
    
    -- Atualizar nível se necessário
    UPDATE gamificacao_usuario 
    SET 
        nivel = novo_nivel,
        experiencia_atual = pontos_totais % 100
    WHERE usuario_id = p_usuario_id;
    
    -- Log da ação
    INSERT INTO logs_atividade (usuario_id, acao, dados_alterados)
    VALUES (p_usuario_id, p_acao, jsonb_build_object('pontos_ganhos', p_pontos, 'novo_nivel', novo_nivel));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÍNDICES COMPOSTOS PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_logs_usuario_timestamp ON logs_atividade(usuario_id, timestamp DESC);
CREATE INDEX idx_eventos_data_tipo ON eventos_escolares(data_evento, tipo) WHERE ativo = true;
CREATE INDEX idx_sessoes_usuario_expires ON sessoes_usuario(usuario_id, expires_at) WHERE expires_at > NOW();

-- ============================================================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================================================

COMMENT ON TABLE usuarios IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE sessoes_usuario IS 'Controle de sessões ativas dos usuários';
COMMENT ON TABLE preferencias_usuario IS 'Configurações pessoais de cada usuário';
COMMENT ON TABLE gamificacao_usuario IS 'Sistema de pontuação e gamificação';
COMMENT ON TABLE atalhos_disponiveis IS 'Atalhos disponíveis no sistema';
COMMENT ON TABLE atalhos_usuario IS 'Atalhos selecionados por cada usuário';
COMMENT ON TABLE eventos_escolares IS 'Calendário de eventos da escola';
COMMENT ON TABLE logs_atividade IS 'Auditoria de todas as ações no sistema';
COMMENT ON TABLE blocos_visitas IS 'Histórico de navegação pelos blocos da escola';

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

-- Verificar se tudo foi criado corretamente
DO $$
BEGIN
    RAISE NOTICE 'Schema criado com sucesso!';
    RAISE NOTICE 'Tabelas criadas: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Usuário admin criado com username: admin e senha: 123456';
    RAISE NOTICE 'Sistema pronto para uso!';
END $$;