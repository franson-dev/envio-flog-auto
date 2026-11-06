
/**
 * ENVIO F-LOG AUTO
 * Agendamentos e execução da rotina.
 *
 * Versão pública para portfólio.
 *
 * Segurança:
 * - Modo de demonstração habilitado por padrão.
 * - Integrações externas desativadas por padrão.
 * - Nenhum gatilho é instalado automaticamente.
 */

/**
 * Verifica se uma integração pode ser utilizada.
 */
function validarExecucaoRealFlog() {
  if (CONFIG.MODO_DEMONSTRACAO === true) {
    throw new Error(
      'Execução bloqueada: o projeto está em modo de demonstração.'
    );
  }

  if (!CONFIG.INTEGRACOES.GMAIL_ATIVO ||
      !CONFIG.INTEGRACOES.FORMS_ATIVO) {
    throw new Error(
      'Execução bloqueada: habilite explicitamente as integrações necessárias.'
    );
  }
}


/**
 * Retorna a data de hoje no fuso configurado.
 */
function obterDataAtualFlog() {
  const hoje = new Date();

  return Utilities.formatDate(
    hoje,
    CONFIG.FUSO_HORARIO,
    'yyyy-MM-dd'
  );
}


/**
 * Cria um objeto Date para o horário configurado no dia atual.
 */
function obterHorarioHojeFlog(horario) {
  const partes = horario.split(':');

  if (partes.length !== 2) {
    throw new Error('Horário inválido: ' + horario);
  }

  const agora = new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    Number(partes[0]),
    Number(partes[1]),
    0
  );
}


/**
 * Verifica se hoje é dia útil.
 */
function ehDiaUtilFlog(data) {
  const dia = data.getDay();

  return dia >= 1 && dia <= 5;
}


/**
 * Monta o lembrete sem enviar e-mail.
 */
function montarLembreteFlog(dataReferencia) {
  const data = dataReferencia instanceof Date
    ? dataReferencia
    : new Date(dataReferencia || new Date());

  if (isNaN(data.getTime())) {
    throw new Error('Data inválida para montar o lembrete.');
  }

  const dataTexto = Utilities.formatDate(
    data,
    CONFIG.FUSO_HORARIO,
    'dd/MM/yyyy'
  );

  const destinatarios = Object.values(CONFIG.EMAILS || {})
    .filter(function(email) {
      return typeof email === 'string' && email.includes('@');
    });

  const assunto =
    CONFIG.IDENTIFICADOR_EMAIL + '-' +
    Utilities.formatDate(data, CONFIG.FUSO_HORARIO, 'yyyyMMdd');

  const produtos = CONFIG.PRODUTOS.join('\n');

  const corpo =
    'Olá!\n\n' +
    'Este é um lembrete de demonstração para o envio da produção diária.\n\n' +
    'Data de referência: ' + dataTexto + '\n' +
    'Horário limite: ' + CONFIG.HORARIOS.ENVIO + '\n\n' +
    'Formato de preenchimento:\n' +
    'Informe cada produto em uma linha e seu respectivo valor na linha seguinte.\n\n' +
    'Produtos configurados:\n' + produtos + '\n\n' +
    'Identifique sua resposta utilizando o assunto indicado neste e-mail.\n\n' +
    'Mensagem gerada pelo ENVIO F-LOG AUTO.';

  return {
    destinatarios: destinatarios,
    assunto: assunto,
    corpo: corpo
  };
}


/**
 * Testa a montagem do lembrete sem enviar mensagem.
 */
function testarMontagemLembreteFlog() {
  const lembrete = montarLembreteFlog(new Date());

  console.assert(
    lembrete.destinatarios.length > 0,
    'Deve haver destinatários de demonstração configurados.'
  );

  console.assert(
    lembrete.assunto.includes(CONFIG.IDENTIFICADOR_EMAIL),
    'O assunto deve utilizar o identificador configurado.'
  );

  console.assert(
    lembrete.corpo.includes(CONFIG.HORARIOS.ENVIO),
    'O corpo deve apresentar o horário limite configurado.'
  );

  Logger.log('Prévia do lembrete:');
  Logger.log(JSON.stringify(lembrete, null, 2));
}


/**
 * Envia o lembrete oficial.
 *
 * Esta função exige que o usuário desative o modo de
 * demonstração e habilite explicitamente o Gmail.
 */
function enviarLembreteOficialFlog() {
  if (CONFIG.MODO_DEMONSTRACAO === true) {
    throw new Error('Envio bloqueado pelo modo de demonstração.');
  }

  if (CONFIG.INTEGRACOES.GMAIL_ATIVO !== true) {
    throw new Error('Integração Gmail desativada.');
  }

  const lembrete = montarLembreteFlog(new Date());

  if (lembrete.destinatarios.length === 0) {
    throw new Error('Nenhum destinatário válido foi configurado.');
  }

  GmailApp.sendEmail(
    lembrete.destinatarios.join(','),
    lembrete.assunto,
    lembrete.corpo
  );

  return { sucesso: true };
}


/**
 * Envia alerta de erro com proteção contra duplicidade.
 */
function enviarAlertaErroFlogProtegido(dataTexto, alerta) {
  if (CONFIG.MODO_DEMONSTRACAO === true) {
    throw new Error('Envio de alerta bloqueado pelo modo de demonstração.');
  }

  if (CONFIG.INTEGRACOES.GMAIL_ATIVO !== true) {
    throw new Error('Integração Gmail desativada.');
  }

  if (!alerta || !Array.isArray(alerta.destinatarios) ||
      alerta.destinatarios.length === 0) {
    throw new Error('Alerta sem destinatários válidos.');
  }

  const chave = 'FLOG_ALERTA_' + dataTexto;
  const propriedades = PropertiesService.getScriptProperties();
  const bloqueio = LockService.getScriptLock();

  if (!bloqueio.tryLock(10000)) {
    return {
      sucesso: false,
      motivo: 'Não foi possível obter o bloqueio do alerta.'
    };
  }

  try {
    if (propriedades.getProperty(chave)) {
      return {
        sucesso: false,
        motivo: 'Já existe um alerta registrado para esta data.'
      };
    }

    propriedades.setProperty(chave, 'EM_PROCESSAMENTO');

    try {
      GmailApp.sendEmail(
        alerta.destinatarios.join(','),
        alerta.assunto,
        alerta.corpo
      );

      propriedades.setProperty(chave, 'ENVIADO');

      return { sucesso: true };

    } catch (erro) {
      propriedades.setProperty(
        chave,
        'ERRO: ' + erro.message
      );

      throw erro;
    }

  } finally {
    bloqueio.releaseLock();
  }
}


/**
 * Executa a rotina automática.
 *
 * Em demonstração, apenas registra que a rotina foi
 * chamada. Não consulta Gmail, não envia mensagens
 * e não submete formulários.
 */
function executarRotinaFlog() {
  const agora = new Date();

  if (!ehDiaUtilFlog(agora)) {
    Logger.log('Rotina ignorada: hoje não é dia útil.');

    return {
      sucesso: true,
      situacao: 'DIA_NAO_UTIL'
    };
  }

  if (CONFIG.MODO_DEMONSTRACAO === true) {
    Logger.log(
      'Modo de demonstração ativo. Nenhuma integração foi executada.'
    );

    Logger.log(
      'Lembrete previsto: ' + CONFIG.HORARIOS.LEMBRETE
    );

    Logger.log(
      'Horário limite previsto: ' + CONFIG.HORARIOS.ENVIO
    );

    return {
      sucesso: true,
      situacao: 'MODO_DEMONSTRACAO',
      integracoesExecutadas: false
    };
  }

  validarExecucaoRealFlog();

  const dataTexto = obterDataAtualFlog();
  const horarioLembrete = obterHorarioHojeFlog(
    CONFIG.HORARIOS.LEMBRETE
  );
  const horarioCorte = obterHorarioHojeFlog(
    CONFIG.HORARIOS.ENVIO
  );

  const propriedades = PropertiesService.getScriptProperties();

  // Lembrete: uma única vez por dia.
  const chaveLembrete = 'FLOG_LEMBRETE_' + dataTexto;

  if (agora >= horarioLembrete &&
      agora < horarioCorte &&
      !propriedades.getProperty(chaveLembrete)) {

    enviarLembreteOficialFlog();

    propriedades.setProperty(chaveLembrete, 'ENVIADO');
  }

  // Processamento: somente após o horário de corte.
  if (agora < horarioCorte) {
    return {
      sucesso: true,
      situacao: 'AGUARDANDO_HORARIO_DE_CORTE'
    };
  }

  const chaveProcessamento = 'FLOG_ROTINA_' + dataTexto;

  if (propriedades.getProperty(chaveProcessamento)) {
    return {
      sucesso: false,
      situacao: 'ROTINA_JA_PROCESSADA'
    };
  }

  const respostas = consultarRespostasDoDia();

  const resultado = processarRespostasFlogSemEnviar(
    respostas,
    agora,
    horarioCorte
  );

  if (!resultado.sucesso) {
    if (resultado.alerta) {
      enviarAlertaErroFlogProtegido(
        dataTexto,
        resultado.alerta
      );
    }

    propriedades.setProperty(
      chaveProcessamento,
      'ERRO'
    );

    return resultado;
  }

  const envio = executarEnvioProtegido(
    agora,
    function() {
      if (CONFIG.MODO_DEMONSTRACAO === true ||
          CONFIG.INTEGRACOES.FORMS_ATIVO !== true) {
        throw new Error(
          'Submissão bloqueada: formulário não habilitado.'
        );
      }

      resultado.respostaFormulario.submit();

      return { sucesso: true };
    }
  );

  if (envio.sucesso) {
    propriedades.setProperty(
      chaveProcessamento,
      'CONCLUIDO'
    );
  }

  return envio;
}


/**
 * Instala um gatilho de cinco em cinco minutos.
 *
 * Por segurança, exige que o usuário tenha habilitado
 * explicitamente as integrações e desativado a demonstração.
 *
 * Esta função não é executada automaticamente.
 */
function instalarGatilhoFlog() {
  validarExecucaoRealFlog();

  const gatilhos = ScriptApp.getProjectTriggers();

  const existente = gatilhos.some(function(gatilho) {
    return gatilho.getHandlerFunction() === 'executarRotinaFlog';
  });

  if (existente) {
    Logger.log('O gatilho da rotina já está instalado.');

    return {
      sucesso: true,
      situacao: 'GATILHO_JA_EXISTENTE'
    };
  }

  ScriptApp.newTrigger('executarRotinaFlog')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Gatilho instalado com intervalo de cinco minutos.');

  return {
    sucesso: true,
    situacao: 'GATILHO_INSTALADO'
  };
}


/**
 * Testa as configurações de segurança.
 */
function testarSegurancaAgendamentosFlog() {
  console.assert(
    CONFIG.MODO_DEMONSTRACAO === true,
    'O modo de demonstração deve iniciar ativado.'
  );

  console.assert(
    CONFIG.INTEGRACOES.GMAIL_ATIVO === false,
    'Gmail deve iniciar desativado.'
  );

  console.assert(
    CONFIG.INTEGRACOES.FORMS_ATIVO === false,
    'Forms deve iniciar desativado.'
  );

  const lembrete = montarLembreteFlog(new Date());

  console.assert(
    lembrete.corpo.includes('Mensagem gerada pelo ENVIO F-LOG AUTO'),
    'A prévia do lembrete deve identificar o projeto.'
  );

  Logger.log('Testes de segurança dos agendamentos concluídos.');
}
