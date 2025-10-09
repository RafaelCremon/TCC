/**
 * ============================================================================
 * MIDDLEWARE DE VALIDAÇÃO
 * ============================================================================
 */

const { body, validationResult, param, query } = require('express-validator');

// Middleware para processar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validações para autenticação
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username deve ter entre 3 e 100 caracteres'),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  
  handleValidationErrors
];

const validateRegister = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('username')
    .notEmpty()
    .withMessage('Username é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username deve ter entre 3 e 100 caracteres')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username só pode conter letras, números, pontos, hífen e underscore'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter ao menos uma letra minúscula, maiúscula e um número'),
  
  body('role')
    .optional()
    .isIn(['admin', 'professor', 'aluno', 'responsavel'])
    .withMessage('Role inválido'),
  
  body('telefone')
    .optional()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (11) 99999-9999'),
  
  handleValidationErrors
];

// Validações para usuários
const validateUpdateUser = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID do usuário inválido'),
  
  body('nome')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('telefone')
    .optional()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (11) 99999-9999'),
  
  body('role')
    .optional()
    .isIn(['admin', 'professor', 'aluno', 'responsavel'])
    .withMessage('Role inválido'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status inválido'),
  
  handleValidationErrors
];

// Validações para preferências
const validatePreferences = [
  body('tema')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Tema deve ser light ou dark'),
  
  body('ja_viu_boas_vindas')
    .optional()
    .isBoolean()
    .withMessage('ja_viu_boas_vindas deve ser boolean'),
  
  handleValidationErrors
];

// Validações para eventos
const validateEvent = [
  body('titulo')
    .notEmpty()
    .withMessage('Título é obrigatório')
    .isLength({ min: 3, max: 255 })
    .withMessage('Título deve ter entre 3 e 255 caracteres'),
  
  body('descricao')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição não pode ter mais de 1000 caracteres'),
  
  body('data_evento')
    .isISO8601()
    .withMessage('Data do evento inválida')
    .toDate(),
  
  body('tipo')
    .optional()
    .isIn(['evento', 'prova', 'reuniao', 'feriado', 'atividade'])
    .withMessage('Tipo de evento inválido'),
  
  body('publico_alvo')
    .optional()
    .isArray()
    .withMessage('Público alvo deve ser um array'),
  
  body('publico_alvo.*')
    .optional()
    .isIn(['admin', 'professor', 'aluno', 'responsavel'])
    .withMessage('Público alvo inválido'),
  
  handleValidationErrors
];

// Validações para atalhos
const validateShortcutSelection = [
  body('atalhos')
    .isArray({ min: 0, max: 6 })
    .withMessage('Atalhos deve ser um array com no máximo 6 itens'),
  
  body('atalhos.*.atalho_id')
    .isInt({ min: 1 })
    .withMessage('ID do atalho inválido'),
  
  body('atalhos.*.posicao')
    .isInt({ min: 1, max: 6 })
    .withMessage('Posição deve ser entre 1 e 6'),
  
  handleValidationErrors
];

// Validações para gamificação
const validateGamificationAction = [
  body('acao')
    .notEmpty()
    .withMessage('Ação é obrigatória')
    .isLength({ min: 3, max: 100 })
    .withMessage('Ação deve ter entre 3 e 100 caracteres'),
  
  body('pontos')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Pontos deve ser um número inteiro positivo'),
  
  handleValidationErrors
];

// Validações para logs
const validateLogQuery = [
  query('limite')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limite deve ser entre 1 e 1000'),
  
  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número positivo'),
  
  query('acao')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Ação deve ter entre 1 e 100 caracteres'),
  
  query('usuario_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID do usuário inválido'),
  
  handleValidationErrors
];

// Validação de ID nos parâmetros
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID inválido'),
  
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRegister,
  validateUpdateUser,
  validatePreferences,
  validateEvent,
  validateShortcutSelection,
  validateGamificationAction,
  validateLogQuery,
  validateId,
  handleValidationErrors
};