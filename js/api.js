/**
 * ============================================================================
 * CONFIGURAÇÃO DA API - FRONTEND
 * ============================================================================
 */

// Configurações da API
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Token JWT armazenado
let authToken = localStorage.getItem('authToken');

/**
 * Classe para fazer requisições à API
 */
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
    }

    // Configurar token de autenticação
    setAuthToken(token) {
        authToken = token;
        localStorage.setItem('authToken', token);
    }

    // Remover token
    clearAuthToken() {
        authToken = null;
        localStorage.removeItem('authToken');
    }

    // Obter headers com autenticação
    getHeaders() {
        const headers = { ...API_CONFIG.headers };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        return headers;
    }

    // Fazer requisição
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        console.log(`🌐 API Request: ${config.method || 'GET'} ${endpoint}`);

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            console.log(`✅ API Success: ${endpoint}`, data);
            return data;

        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            
            // Se token expirou, limpar e redirecionar para login
            if (error.message.includes('401') || error.message.includes('token')) {
                this.clearAuthToken();
                if (window.location.pathname !== '/login.html') {
                    window.location.href = '/login.html';
                }
            }
            
            throw error;
        }
    }

    // Métodos HTTP
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Instância global da API
const api = new ApiClient();

/**
 * ============================================================================
 * FUNÇÕES DE AUTENTICAÇÃO
 * ============================================================================
 */

// Fazer login
async function login(username, password) {
    try {
        const response = await api.post('/auth/login', { username, password });
        
        // Salvar token e dados do usuário
        api.setAuthToken(response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        console.log('✅ Login realizado com sucesso!', response.user);
        return response;
        
    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        throw error;
    }
}

// Fazer logout
async function logout() {
    try {
        if (authToken) {
            await api.post('/auth/logout', { token: authToken });
        }
    } catch (error) {
        console.error('⚠️ Erro no logout:', error.message);
    } finally {
        // Sempre limpar dados locais
        api.clearAuthToken();
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
    }
}

// Verificar se está logado
function isLoggedIn() {
    return !!authToken && !!localStorage.getItem('userData');
}

// Obter dados do usuário logado
function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Proteger página (redirecionar se não logado)
function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

/**
 * ============================================================================
 * FUNÇÕES DA API ESPECÍFICAS
 * ============================================================================
 */

// Buscar preferências do usuário
async function getPreferences() {
    try {
        const response = await api.get('/preferences');
        return response.preferencias;
    } catch (error) {
        console.error('❌ Erro ao buscar preferências:', error);
        return { tema: 'claro', ja_viu_boas_vindas: false };
    }
}

// Atualizar preferências
async function updatePreferences(preferences) {
    try {
        await api.put('/preferences', preferences);
        console.log('✅ Preferências atualizadas');
        return true;
    } catch (error) {
        console.error('❌ Erro ao atualizar preferências:', error);
        return false;
    }
}

// Marcar boas-vindas como vista
async function markWelcomeSeen() {
    try {
        await api.post('/preferences/welcome-seen');
        console.log('✅ Boas-vindas marcadas como vistas');
        return true;
    } catch (error) {
        console.error('❌ Erro ao marcar boas-vindas:', error);
        return false;
    }
}

// Buscar dados de gamificação
async function getGamificationData() {
    try {
        const response = await api.get('/gamification/profile');
        return response.gamificacao;
    } catch (error) {
        console.error('❌ Erro ao buscar gamificação:', error);
        return { pontos_totais: 0, nivel: 1, badges: [], streak_atual: 0 };
    }
}

// Registrar ação de gamificação
async function recordGameAction(action, data = {}) {
    try {
        const response = await api.post('/gamification/action', {
            acao: action,
            dados: data
        });
        console.log(`✅ Ação registrada: ${action}`, response);
        return response;
    } catch (error) {
        console.error(`❌ Erro ao registrar ação ${action}:`, error);
        return null;
    }
}

// Buscar atalhos do usuário
async function getUserShortcuts() {
    try {
        const response = await api.get('/shortcuts/user');
        return response.atalhos;
    } catch (error) {
        console.error('❌ Erro ao buscar atalhos:', error);
        return [];
    }
}

// Buscar atalhos disponíveis
async function getAvailableShortcuts() {
    try {
        const response = await api.get('/shortcuts/available');
        return response.atalhos;
    } catch (error) {
        console.error('❌ Erro ao buscar atalhos disponíveis:', error);
        return [];
    }
}

// Salvar seleção de atalhos
async function saveShortcutSelection(shortcuts) {
    try {
        await api.post('/shortcuts/user/select', { atalhos: shortcuts });
        console.log('✅ Atalhos salvos');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar atalhos:', error);
        return false;
    }
}

// Buscar eventos
async function getEvents(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/events?${queryParams}` : '/events';
        const response = await api.get(endpoint);
        return response.eventos;
    } catch (error) {
        console.error('❌ Erro ao buscar eventos:', error);
        return [];
    }
}

// Buscar próximos eventos
async function getUpcomingEvents(limit = 5) {
    try {
        const response = await api.get(`/events/proximos/lista?limite=${limit}`);
        return response.proximos_eventos;
    } catch (error) {
        console.error('❌ Erro ao buscar próximos eventos:', error);
        return [];
    }
}

/**
 * ============================================================================
 * FUNÇÕES DE UTILIDADE
 * ============================================================================
 */

// Mostrar notificação
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // Aqui você pode implementar sua lógica de notificação visual
}

// Formatear erros da API
function formatApiError(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return 'Erro desconhecido';
}

console.log('🔗 API Client carregado e pronto para uso!');