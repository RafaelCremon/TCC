#!/bin/bash

# Script de instalação automática do Backend - Escola TCC
# Execute com: bash install.sh

echo "🚀 ============================================"
echo "🚀 INSTALAÇÃO DO BACKEND - ESCOLA TCC"
echo "🚀 ============================================"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro."
    echo "   Baixe em: https://nodejs.org/"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -c 2-)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $NODE_VERSION"
    exit 1
fi

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado. Por favor, instale o PostgreSQL 12+ primeiro."
    echo "   Windows: https://www.postgresql.org/download/windows/"
    echo "   Ou use: choco install postgresql"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"
echo "✅ PostgreSQL encontrado"

# Instalar dependências
echo ""
echo "📦 Instalando dependências do Node.js..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas com sucesso"

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Criando arquivo .env..."
    
    # Gerar JWT secret aleatório
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    
    cat > .env << EOF
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
JWT_SECRET=$JWT_SECRET
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
EOF
    
    echo "✅ Arquivo .env criado"
    echo "⚠️  IMPORTANTE: Revise as configurações do banco de dados no arquivo .env"
else
    echo "✅ Arquivo .env já existe"
fi

# Configurar banco de dados
echo ""
echo "🗄️  Configurando banco de dados..."
echo "IMPORTANTE: Certifique-se de que o PostgreSQL está rodando e você tem as credenciais corretas."
echo ""

read -p "Deseja executar a configuração automática do banco? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Ler configurações do .env
    source .env
    
    echo "Tentando conectar ao PostgreSQL..."
    
    # Testar se consegue conectar como postgres
    if psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Conectado ao PostgreSQL como superuser"
        
        # Criar banco e usuário
        echo "Criando banco de dados e usuário..."
        
        psql -U postgres << EOF
-- Criar banco de dados se não existir
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Criar usuário se não existir
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
        
        if [ $? -eq 0 ]; then
            echo "✅ Banco de dados e usuário criados com sucesso"
            
            # Executar schema
            echo "Executando schema do banco de dados..."
            if [ -f "schema.sql" ]; then
                psql -U $DB_USER -d $DB_NAME -f schema.sql
                
                if [ $? -eq 0 ]; then
                    echo "✅ Schema executado com sucesso"
                else
                    echo "❌ Erro ao executar schema"
                fi
            else
                echo "⚠️  Arquivo schema.sql não encontrado"
            fi
        else
            echo "❌ Erro ao criar banco de dados"
        fi
    else
        echo "❌ Não foi possível conectar ao PostgreSQL"
        echo "   Verifique se o PostgreSQL está rodando e tente:"
        echo "   psql -U postgres"
    fi
else
    echo "⚠️  Configuração manual necessária:"
    echo "   1. Conecte ao PostgreSQL: psql -U postgres"
    echo "   2. Execute: CREATE DATABASE escola_tcc;"
    echo "   3. Execute: CREATE USER escola_user WITH PASSWORD 'senha_segura_123';"
    echo "   4. Execute: GRANT ALL PRIVILEGES ON DATABASE escola_tcc TO escola_user;"
    echo "   5. Execute: psql -U escola_user -d escola_tcc -f schema.sql"
fi

# Criar diretório de logs
echo ""
echo "📝 Criando diretório de logs..."
mkdir -p logs
echo "✅ Diretório de logs criado"

# Testar aplicação
echo ""
echo "🧪 Testando aplicação..."

# Testar conexão com banco
node -e "
const { testConnection } = require('./config/database');
testConnection().then(success => {
    if (success) {
        console.log('✅ Conexão com banco de dados OK');
        process.exit(0);
    } else {
        console.log('❌ Erro na conexão com banco de dados');
        process.exit(1);
    }
}).catch(err => {
    console.log('❌ Erro ao testar conexão:', err.message);
    process.exit(1);
});
" && DB_TEST_SUCCESS=true || DB_TEST_SUCCESS=false

if [ "$DB_TEST_SUCCESS" = true ]; then
    echo "✅ Teste de conexão com banco passou"
else
    echo "❌ Teste de conexão com banco falhou"
    echo "   Verifique as configurações no arquivo .env"
fi

echo ""
echo "🎉 ============================================"
echo "🎉 INSTALAÇÃO CONCLUÍDA!"
echo "🎉 ============================================"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Revise as configurações no arquivo .env"
echo "2. Inicie o servidor em desenvolvimento:"
echo "   npm run dev"
echo ""
echo "3. Ou inicie em produção:"
echo "   npm start"
echo ""
echo "4. Teste a API:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "5. Acesse a documentação completa no README.md"
echo ""

if [ "$DB_TEST_SUCCESS" = false ]; then
    echo "⚠️  ATENÇÃO: Configure o banco de dados antes de usar!"
    echo ""
fi

echo "🚀 Servidor estará disponível em: http://localhost:3000"
echo "📚 API Health Check: http://localhost:3000/api/health"