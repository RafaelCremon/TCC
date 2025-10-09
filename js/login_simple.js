/**
 * ============================================================================
 * SISTEMA DE LOGIN SIMPLIFICADO
 * ============================================================================
 */

// Função de login simplificada
function login() {
    console.log('🔐 Login simplificado iniciado');
    
    // Buscar campos
    const usernameInput = document.getElementById('username') || document.getElementById('usuario');
    const passwordInput = document.getElementById('password') || document.getElementById('senha');
    const errorDiv = document.getElementById('error-message') || document.getElementById('erroUsuario');
    
    if (!usernameInput || !passwordInput) {
        console.error('❌ Campos não encontrados');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    console.log('📝 Tentativa de login:', { username, password: password ? '***' : 'vazio' });
    
    // Limpar erros
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // Validação básica
    if (!username || !password) {
        showError('Por favor, preencha todos os campos');
        return;
    }
    
    // Credenciais válidas
    const validCredentials = [
        { user: 'admin', pass: '123456' },
        { user: 'admin', pass: 'admin123' },
        { user: 'admin', pass: '1234' }
    ];
    
    const isValid = validCredentials.some(cred => 
        cred.user === username && cred.pass === password
    );
    
    if (isValid) {
        console.log('✅ Credenciais válidas!');
        
        // Salvar dados básicos
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('loginTime', new Date().toISOString());
        
        // Mostrar sucesso
        showSuccess('Login realizado com sucesso!');
        
        // Redirecionar
        setTimeout(() => {
            window.location.href = 'pages/inicial.html';
        }, 1000);
        
    } else {
        console.log('❌ Credenciais inválidas');
        showError('Usuário ou senha incorretos');
    }
}

// Função para mostrar erro
function showError(message) {
    const errorDiv = document.getElementById('error-message') || document.getElementById('erroUsuario');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#d32f2f';
        errorDiv.style.backgroundColor = '#ffebee';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.border = '1px solid #f44336';
        errorDiv.style.marginBottom = '10px';
    }
}

// Função para mostrar sucesso
function showSuccess(message) {
    const errorDiv = document.getElementById('error-message') || document.getElementById('erroUsuario');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#2e7d32';
        errorDiv.style.backgroundColor = '#e8f5e8';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.border = '1px solid #4caf50';
        errorDiv.style.marginBottom = '10px';
    }
}

// Função de teste
window.testLogin = function() {
    const usernameField = document.getElementById('username') || document.getElementById('usuario');
    const passwordField = document.getElementById('password') || document.getElementById('senha');
    
    if (usernameField && passwordField) {
        usernameField.value = 'admin';
        passwordField.value = '123456';
        login();
    }
};

// Quando carregar a página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Sistema de login simplificado carregado');
    
    // Configurar formulário se existir
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // Focar no primeiro campo
    const firstField = document.getElementById('username') || document.getElementById('usuario');
    if (firstField) {
        firstField.focus();
    }
});

console.log('🔐 Login simplificado carregado! Use: admin / 123456');