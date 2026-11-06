
/**
 * ENVIO F-LOG AUTO
 * Configuração da versão demonstrativa para portfólio.
 *
 * Todos os dados são fictícios.
 * Configure um formulário e participantes de teste
 * antes de executar qualquer integração.
 */

const CONFIG = {
  NOME_PROJETO: 'ENVIO F-LOG AUTO - DEMONSTRACAO',

  IDENTIFICADOR_EMAIL: 'DEMO-AUTO-PRODUCAO',
  MODO_DEMONSTRACAO: true,

  INTEGRACOES: {
    GMAIL_ATIVO: false,
    FORMS_ATIVO: false
  },


  FORMULARIO: {
    ID: 'INSIRA_O_ID_DO_SEU_FORMULARIO_DE_TESTE'
  },

  EMAILS: {
    PARTICIPANTE_A: 'participante.a@example.com',
    PARTICIPANTE_B: 'participante.b@example.com',
    PARTICIPANTE_C: 'participante.c@example.com'
  },

  HORARIOS: {
    LEMBRETE: '16:15',
    ENVIO: '16:30'
  },

  FUSO_HORARIO: 'America/Sao_Paulo',

  PRIORIDADE: [
    'PARTICIPANTE_A',
    'PARTICIPANTE_B',
    'PARTICIPANTE_C'
  ],

  FORMULARIO_PADRAO: {
    ANO: '2026',
    CORRETORA: 'CORRETORA DEMONSTRATIVA',
    PRODUTOR: 'Participante A',
    SEGMENTO: 'Demonstracao',
    AGENCIA: 'AGENCIA TESTE'
  },

  // IDs fictícios. Substituir pelos IDs de um
  // formulário próprio de demonstração.
  CAMPOS_FORMULARIO: {
    DATA: 1001,
    MES: 1002,
    ANO: 1003,
    CORRETORA: 1004,
    PRODUTOR: 1005,
    SEGMENTO: 1006,
    AGENCIA: 1007,
    VIDA_UNICO_ANUAL: 1008,
    VIDA_MENSAL: 1009,
    DENTAL_PJ: 1010,
    SAUDE: 1011,
    AUTO: 1012,
    RE: 1013,
    SWISS_RE: 1014
  },

  PRODUTOS: [
    'VIDA_UNICO_ANUAL',
    'VIDA_MENSAL',
    'DENTAL_PJ',
    'SAUDE',
    'AUTO',
    'RE',
    'SWISS_RE'
  ]
};
