
/**
 * ENVIO F-LOG AUTO
 * Ponto de entrada do Web App.
 *
 * Versão pública para portfólio.
 */

/**
 * Exibe a interface principal do projeto.
 */
function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');

  return template.evaluate()
    .setTitle('ENVIO F-LOG AUTO')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * Inclui arquivos HTML adicionais na interface.
 */
function incluirArquivo(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}

/**
 * Retorna informações gerais do projeto para a interface.
 * Não expõe e-mails, IDs ou dados de participantes.
 */
function obterStatusProjeto() {
  return {
    nome: CONFIG.NOME_PROJETO,
    modoDemonstracao: CONFIG.MODO_DEMONSTRACAO,
    integracoes: {
      gmail: CONFIG.INTEGRACOES.GMAIL_ATIVO,
      forms: CONFIG.INTEGRACOES.FORMS_ATIVO
    },
    horarios: {
      lembrete: CONFIG.HORARIOS.LEMBRETE,
      envio: CONFIG.HORARIOS.ENVIO
    }
  };
}
