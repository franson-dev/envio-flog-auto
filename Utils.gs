
/**
 * ENVIO F-LOG AUTO
 * Funções auxiliares e diagnóstico de configuração.
 *
 * Versão pública para portfólio.
 */

/**
 * Verifica a estrutura básica da configuração
 * sem expor e-mails ou identificadores privados.
 */
function testarConfiguracao() {
  const verificacoes = {
    projetoConfigurado: Boolean(CONFIG.NOME_PROJETO),
    modoDemonstracao: CONFIG.MODO_DEMONSTRACAO === true,

    gmailDesativado:
      CONFIG.INTEGRACOES.GMAIL_ATIVO === false,

    formsDesativado:
      CONFIG.INTEGRACOES.FORMS_ATIVO === false,

    formularioConfigurado:
      Boolean(CONFIG.FORMULARIO.ID) &&
      CONFIG.FORMULARIO.ID !==
        'INSIRA_O_ID_DO_SEU_FORMULARIO_DE_TESTE',

    participantesConfigurados:
      Object.keys(CONFIG.EMAILS).length === 3,

    horariosConfigurados:
      Boolean(CONFIG.HORARIOS.LEMBRETE) &&
      Boolean(CONFIG.HORARIOS.ENVIO),

    prioridadeConfigurada:
      Array.isArray(CONFIG.PRIORIDADE) &&
      CONFIG.PRIORIDADE.length > 0,

    produtosConfigurados:
      Array.isArray(CONFIG.PRODUTOS) &&
      CONFIG.PRODUTOS.length > 0,

    camposFormularioConfigurados:
      Object.keys(CONFIG.CAMPOS_FORMULARIO).length > 0
  };

  const aprovado = Object.values(verificacoes).every(
    function(resultado) {
      return resultado === true;
    }
  );

  Logger.log('=== DIAGNÓSTICO DO ENVIO F-LOG AUTO ===');
  Logger.log(JSON.stringify(verificacoes, null, 2));
  Logger.log('Resultado geral: ' + (aprovado ? 'APROVADO' : 'REVISAR'));

  return {
    sucesso: aprovado,
    verificacoes: verificacoes
  };
}
