/**
 * ============================================================================
 * SISTEMA DE LOGIN - INTEGRADO COM API
 * ============================================================================
 */

// Função global de login para compatibilidade
window.login = function() {
    console.log('🔐 Função login() chamada');
    doLogin();
};

// Aguardar o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Sistema de login carregado');
    
    // Se já estiver logado, redirecionar
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        console.log('✅ Usuário já está logado, redirecionando...');
        window.location.href = '/pages/inicial.html';
        return;
    }
    
    // Configurar eventos do formulário
    setupLoginForm();
    setupPasswordToggle();
    setupAutoFocus();
});

/**
 * Configurar formulário de login
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.log('⚠️ Formulário não encontrado, usando evento no botão');
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await doLogin();
    });
}

/**
 * Processar login
 */
async function doLogin() {
    console.log('🔄 doLogin() iniciado');
    
    // Buscar campos pelos IDs corretos
    const usernameInput = document.getElementById('username') || document.getElementById('usuario');
    const passwordInput = document.getElementById('password') || document.getElementById('senha');
    const loginButton = document.getElementById('loginButton') || document.querySelector('button[onclick="login()"]');
    const errorDiv = document.getElementById('error-message');
    
    console.log('🔍 Campos encontrados:', {
        username: usernameInput?.id,
        password: passwordInput?.id,
        button: loginButton?.id || 'button with onclick',
        error: errorDiv?.id
    });
    
    // Validar campos
    const username = usernameInput?.value?.trim();
    const password = passwordInput?.value;
    
    console.log('📝 Valores:', { username: username || 'vazio', password: password ? '***' : 'vazio' });
    
    if (!username || !password) {
        showError('Por favor, preencha todos os campos');
        return;
    }
    
    // Mostrar loading
    setLoginLoading(true);
    hideError();
    
    try {
        console.log('🔄 Tentando fazer login...');
        
        // Verificar se API está disponível
        if (typeof api === 'undefined') {
            throw new Error('API não está disponível');
        }
        
        // Fazer login via API diretamente
        const response = await api.post('/auth/login', { username, password });
        
        // Salvar token e dados do usuário
        api.setAuthToken(response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        console.log('✅ Login realizado com sucesso!', response.user);
        
        // Mostrar sucesso
        showSuccess('Login realizado com sucesso!');
        
        // Aguardar um pouco e redirecionar
        setTimeout(() => {
            window.location.href = '/pages/inicial.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        showError(error.message || 'Erro ao fazer login');
        
    } finally {
        setLoginLoading(false);
    }
}

/**
 * Mostrar/ocultar senha
 */
function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password') || document.getElementById('senha');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Trocar ícone
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
}

/**
 * Focar no primeiro campo
 */
function setupAutoFocus() {
    const usernameInput = document.getElementById('username') || document.getElementById('usuario');
    if (usernameInput) {
        usernameInput.focus();
    }
}

/**
 * Controlar estado de loading do botão
 */
function setLoginLoading(loading) {
    const loginButton = document.getElementById('loginButton') || document.querySelector('button[onclick="login()"]');
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');
    
    if (loginButton) {
        loginButton.disabled = loading;
    }
    
    if (buttonText) {
        buttonText.textContent = loading ? 'Entrando...' : 'Entrar';
    }
    
    if (buttonSpinner) {
        buttonSpinner.style.display = loading ? 'inline-block' : 'none';
    }
}

/**
 * Mostrar erro
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message') || document.getElementById('erroUsuario');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'alert alert-danger';
    }
}

/**
 * Mostrar sucesso
 */
function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'alert alert-success';
    }
}

/**
 * Ocultar mensagem
 */
function hideError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * ============================================================================
 * FUNÇÕES DE TESTE E DEBUG
 * ============================================================================
 */

// Função simples para testar se o JavaScript está funcionando
window.testAlert = function() {
    alert('JavaScript funcionando!');
};

// Função para testar login com dados de exemplo
window.testLogin = function() {
    console.log('🧪 Testando login...');
    
    const usernameField = document.getElementById('username') || document.getElementById('usuario');
    const passwordField = document.getElementById('password') || document.getElementById('senha');
    
    if (usernameField && passwordField) {
        usernameField.value = 'admin';
        passwordField.value = '123456';
        doLogin();
    } else {
        console.error('❌ Campos não encontrados');
    }
};

// Verificar se API está carregada
window.checkAPI = function() {
    console.log('🔍 Verificando API...');
    console.log('ApiClient disponível:', typeof ApiClient !== 'undefined');
    console.log('api object disponível:', typeof api !== 'undefined');
    console.log('isLoggedIn function disponível:', typeof isLoggedIn === 'function');
};

console.log('🔐 Sistema de login integrado com API carregado!');
console.log('💡 Comandos de teste disponíveis:');
console.log('   - testAlert() - Testa se JS está funcionando');
console.log('   - testLogin() - Testa login com admin/123456'); 
console.log('   - checkAPI() - Verifica se API está carregada');
