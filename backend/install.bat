@echo off
REM Script de instalacao automatica do Backend - Escola TCC
REM Execute como Administrador: install.bat

echo.
echo ================================================
echo INSTALACAO DO BACKEND - ESCOLA TCC
echo ================================================
echo.

REM Verificar se Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado. Por favor, instale o Node.js 18+ primeiro.
    echo    Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se PostgreSQL esta instalado
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL nao encontrado. Por favor, instale o PostgreSQL 12+ primeiro.
    echo    Windows: https://www.postgresql.org/download/windows/
    echo    Ou use: choco install postgresql
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo ✅ PostgreSQL encontrado
echo.

REM Instalar dependencias
echo 📦 Instalando dependencias do Node.js...
npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas com sucesso
echo.

REM Verificar se arquivo .env existe
if not exist ".env" (
    echo 📝 Criando arquivo .env...
    
    REM Gerar JWT secret aleatorio (usando timestamp)
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "JWT_SECRET=%dt:~0,32%"
    
    (
        echo # Configuracoes do servidor
        echo NODE_ENV=development
        echo PORT=3000
        echo.
        echo # Configuracoes do banco de dados
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=escola_tcc
        echo DB_USER=escola_user
        echo DB_PASSWORD=senha_segura_123
        echo.
        echo # Configuracoes JWT
        echo JWT_SECRET=%JWT_SECRET%
        echo JWT_EXPIRATION=24h
        echo.
        echo # Configuracoes de seguranca
        echo BCRYPT_ROUNDS=12
        echo.
        echo # Configuracoes CORS
        echo FRONTEND_URL=http://localhost:8080
        echo.
        echo # Configuracoes de Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Configuracoes de logs
        echo LOG_FORMAT=combined
    ) > .env
    
    echo ✅ Arquivo .env criado
    echo ⚠️  IMPORTANTE: Revise as configuracoes do banco de dados no arquivo .env
) else (
    echo ✅ Arquivo .env ja existe
)

echo.

REM Configurar banco de dados
echo 🗄️  Configurando banco de dados...
echo IMPORTANTE: Certifique-se de que o PostgreSQL esta rodando e voce tem as credenciais corretas.
echo.

set /p "config_auto=Deseja executar a configuracao automatica do banco? (y/N): "
if /i "%config_auto%"=="y" (
    echo Tentando conectar ao PostgreSQL...
    
    REM Testar se consegue conectar como postgres
    psql -U postgres -c "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Conectado ao PostgreSQL como superuser
        
        REM Criar banco e usuario
        echo Criando banco de dados e usuario...
        
        REM Criar script SQL temporario
        (
            echo -- Criar banco de dados se nao existir
            echo SELECT 'CREATE DATABASE escola_tcc' WHERE NOT EXISTS ^(SELECT FROM pg_database WHERE datname = 'escola_tcc'^^\);\gexec
            echo.
            echo -- Criar usuario se nao existir
            echo DO $do$
            echo BEGIN
            echo     IF NOT EXISTS ^(SELECT FROM pg_roles WHERE rolname = 'escola_user'^) THEN
            echo         CREATE USER escola_user WITH PASSWORD 'senha_segura_123';
            echo     END IF;
            echo END
            echo $do$;
            echo.
            echo -- Dar permissoes
            echo GRANT ALL PRIVILEGES ON DATABASE escola_tcc TO escola_user;
        ) > temp_setup.sql
        
        psql -U postgres -f temp_setup.sql
        if %errorlevel% equ 0 (
            echo ✅ Banco de dados e usuario criados com sucesso
            
            REM Executar schema
            echo Executando schema do banco de dados...
            if exist "schema.sql" (
                psql -U escola_user -d escola_tcc -f schema.sql
                if %errorlevel% equ 0 (
                    echo ✅ Schema executado com sucesso
                ) else (
                    echo ❌ Erro ao executar schema
                )
            ) else (
                echo ⚠️  Arquivo schema.sql nao encontrado
            )
        ) else (
            echo ❌ Erro ao criar banco de dados
        )
        
        REM Limpar arquivo temporario
        if exist "temp_setup.sql" del temp_setup.sql
    ) else (
        echo ❌ Nao foi possivel conectar ao PostgreSQL
        echo    Verifique se o PostgreSQL esta rodando e tente:
        echo    psql -U postgres
    )
) else (
    echo ⚠️  Configuracao manual necessaria:
    echo    1. Conecte ao PostgreSQL: psql -U postgres
    echo    2. Execute: CREATE DATABASE escola_tcc;
    echo    3. Execute: CREATE USER escola_user WITH PASSWORD 'senha_segura_123';
    echo    4. Execute: GRANT ALL PRIVILEGES ON DATABASE escola_tcc TO escola_user;
    echo    5. Execute: psql -U escola_user -d escola_tcc -f schema.sql
)

echo.

REM Criar diretorio de logs
echo 📝 Criando diretorio de logs...
if not exist "logs" mkdir logs
echo ✅ Diretorio de logs criado
echo.

REM Testar aplicacao
echo 🧪 Testando aplicacao...

REM Testar conexao com banco
node -e "const { testConnection } = require('./config/database'); testConnection().then(success => { if (success) { console.log('✅ Conexao com banco de dados OK'); process.exit(0); } else { console.log('❌ Erro na conexao com banco de dados'); process.exit(1); } }).catch(err => { console.log('❌ Erro ao testar conexao:', err.message); process.exit(1); });"

if %errorlevel% equ 0 (
    echo ✅ Teste de conexao com banco passou
    set "DB_TEST_SUCCESS=true"
) else (
    echo ❌ Teste de conexao com banco falhou
    echo    Verifique as configuracoes no arquivo .env
    set "DB_TEST_SUCCESS=false"
)

echo.
echo ================================================
echo INSTALACAO CONCLUIDA!
echo ================================================
echo.
echo 📋 PROXIMOS PASSOS:
echo.
echo 1. Revise as configuracoes no arquivo .env
echo 2. Inicie o servidor em desenvolvimento:
echo    npm run dev
echo.
echo 3. Ou inicie em producao:
echo    npm start
echo.
echo 4. Teste a API:
echo    curl http://localhost:3000/api/health
echo.
echo 5. Acesse a documentacao completa no README.md
echo.

if "%DB_TEST_SUCCESS%"=="false" (
    echo ⚠️  ATENCAO: Configure o banco de dados antes de usar!
    echo.
)

echo 🚀 Servidor estara disponivel em: http://localhost:3000
echo 📚 API Health Check: http://localhost:3000/api/health
echo.

pause