
/**
 * ENVIO F-LOG AUTO
 * Controle de seleção, validação e proteção de envios.
 *
 * Versão pública para portfólio.
 * Não realiza envio de e-mail nem submissão de formulário.
 */

/**
 * Seleciona a resposta que deve ser considerada.
 *
 * Regra:
 * 1. O primeiro participante da CONFIG.PRIORIDADE
 *    possui prioridade absoluta.
 * 2. Se ele não responder, seleciona a resposta
 *    mais recente entre os demais participantes.
 * 3. Respostas posteriores ao horário de corte são ignoradas.
 */
function selecionarRespostaPrioritaria(respostas, horarioCorte) {
  if (!Array.isArray(respostas)) {
    return {
      sucesso: false,
      motivo: 'A lista de respostas é inválida.'
    };
  }

  const participantes = CONFIG.PRIORIDADE || [];
  const participantePrioritario = participantes[0];

  const corte = horarioCorte instanceof Date
    ? horarioCorte.getTime()
    : new Date(horarioCorte).getTime();

  if (!Number.isFinite(corte)) {
    return {
      sucesso: false,
      motivo: 'Horário de corte inválido.'
    };
  }

  const respostasValidas = respostas.filter(function(resposta) {
    if (!resposta || !participantes.includes(resposta.participante)) {
      return false;
    }

    const timestamp = new Date(resposta.dataTimestamp).getTime();

    return Number.isFinite(timestamp) && timestamp <= corte;
  });

  if (respostasValidas.length === 0) {
    return {
      sucesso: true,
      situacao: 'SEM_RESPOSTAS',
      valoresZerados: true,
      participante: null,
      corpo: null
    };
  }

  const respostasPrioritarias = respostasValidas.filter(function(resposta) {
    return resposta.participante === participantePrioritario;
  });

  const grupoSelecionavel = respostasPrioritarias.length > 0
    ? respostasPrioritarias
    : respostasValidas.filter(function(resposta) {
        return resposta.participante !== participantePrioritario;
      });

  grupoSelecionavel.sort(function(a, b) {
    return new Date(b.dataTimestamp).getTime() -
      new Date(a.dataTimestamp).getTime();
  });

  const selecionada = grupoSelecionavel[0];

  return {
    sucesso: true,
    situacao: 'RESPOSTA_SELECIONADA',
    valoresZerados: false,
    participante: selecionada.participante,
    corpo: selecionada.corpo,
    dataTimestamp: selecionada.dataTimestamp
  };
}


/**
 * Testes da regra de prioridade.
 * Utiliza somente participantes e dados fictícios.
 */
function testarSelecaoPrioritaria() {
  const corte = new Date('2026-11-06T16:30:00-03:00');

  const respostas = [
    {
      participante: 'PARTICIPANTE_A',
      dataTimestamp: '2026-11-06T15:00:00-03:00',
      corpo: 'Resposta A'
    },
    {
      participante: 'PARTICIPANTE_B',
      dataTimestamp: '2026-11-06T16:20:00-03:00',
      corpo: 'Resposta B'
    },
    {
      participante: 'PARTICIPANTE_C',
      dataTimestamp: '2026-11-06T16:25:00-03:00',
      corpo: 'Resposta C'
    }
  ];

  const resultado = selecionarRespostaPrioritaria(respostas, corte);

  console.assert(
    resultado.participante === 'PARTICIPANTE_A',
    'O participante prioritário deve prevalecer.'
  );

  const semA = selecionarRespostaPrioritaria(
    respostas.filter(function(r) {
      return r.participante !== 'PARTICIPANTE_A';
    }),
    corte
  );

  console.assert(
    semA.participante === 'PARTICIPANTE_C',
    'Sem A, deve prevalecer a resposta mais recente.'
  );

  const semRespostas = selecionarRespostaPrioritaria([], corte);

  console.assert(
    semRespostas.situacao === 'SEM_RESPOSTAS',
    'A ausência de respostas deve ser identificada.'
  );

  const foraDoPrazo = selecionarRespostaPrioritaria([
    {
      participante: 'PARTICIPANTE_B',
      dataTimestamp: '2026-11-06T16:31:00-03:00',
      corpo: 'Resposta fora do prazo'
    }
  ], corte);

  console.assert(
    foraDoPrazo.situacao === 'SEM_RESPOSTAS',
    'Respostas posteriores ao corte devem ser ignoradas.'
  );

  Logger.log('Testes de prioridade concluídos.');
}


/**
 * Protege uma operação contra execução duplicada.
 *
 * A função recebida é executada somente se ainda não
 * houver registro de processamento para a data.
 *
 * Não realiza integrações por conta própria.
 */
function executarEnvioProtegido(dataProducao, funcaoEnvio) {
  if (typeof funcaoEnvio !== 'function') {
    throw new Error('A operação informada não é uma função.');
  }

  const data = dataProducao instanceof Date
    ? dataProducao
    : new Date(dataProducao);

  if (isNaN(data.getTime())) {
    throw new Error('Data de produção inválida.');
  }

  const dataTexto = Utilities.formatDate(
    data,
    CONFIG.FUSO_HORARIO,
    'yyyy-MM-dd'
  );

  const chave = 'FLOG_ENVIO_' + dataTexto;
  const propriedades = PropertiesService.getScriptProperties();
  const bloqueio = LockService.getScriptLock();

  if (!bloqueio.tryLock(10000)) {
    return {
      sucesso: false,
      motivo: 'Não foi possível obter o bloqueio de execução.'
    };
  }

  try {
    const registroExistente = propriedades.getProperty(chave);

    if (registroExistente) {
      return {
        sucesso: false,
        motivo: 'Já existe um registro de processamento para esta data.',
        registro: registroExistente
      };
    }

    propriedades.setProperty(chave, JSON.stringify({
      status: 'EM_PROCESSAMENTO',
      data: dataTexto,
      atualizadoEm: new Date().toISOString()
    }));

    try {
      const resultado = funcaoEnvio();

      if (!resultado || resultado.sucesso !== true) {
        throw new Error('A operação não confirmou sucesso.');
      }

      propriedades.setProperty(chave, JSON.stringify({
        status: 'ENVIADO',
        data: dataTexto,
        atualizadoEm: new Date().toISOString()
      }));

      return {
        sucesso: true,
        data: dataTexto,
        resultado: resultado
      };

    } catch (erro) {
      propriedades.setProperty(chave, JSON.stringify({
        status: 'ERRO',
        data: dataTexto,
        atualizadoEm: new Date().toISOString(),
        mensagem: erro.message
      }));

      throw erro;
    }

  } finally {
    bloqueio.releaseLock();
  }
}


/**
 * Testa a proteção contra duplicidade com uma data fictícia.
 */
function testarProtecaoEnvio() {
  const dataTeste = new Date('2099-12-31T12:00:00-03:00');

  const dataTexto = Utilities.formatDate(
    dataTeste,
    CONFIG.FUSO_HORARIO,
    'yyyy-MM-dd'
  );

  const chave = 'FLOG_ENVIO_' + dataTexto;
  const propriedades = PropertiesService.getScriptProperties();

  propriedades.deleteProperty(chave);

  try {
    const primeiraExecucao = executarEnvioProtegido(
      dataTeste,
      function() {
        return { sucesso: true, teste: true };
      }
    );

    const segundaExecucao = executarEnvioProtegido(
      dataTeste,
      function() {
        return { sucesso: true, teste: true };
      }
    );

    console.assert(
      primeiraExecucao.sucesso === true,
      'A primeira execução deve ser permitida.'
    );

    console.assert(
      segundaExecucao.sucesso === false,
      'A segunda execução deve ser bloqueada.'
    );

    Logger.log('Teste de proteção contra duplicidade concluído.');

  } finally {
    propriedades.deleteProperty(chave);
  }
}


/**
 * Monta um alerta sem enviá-lo.
 */
function montarAlertaErroFlog(dataProducao, participante, motivo) {
  const data = dataProducao instanceof Date
    ? dataProducao
    : new Date(dataProducao);

  if (isNaN(data.getTime())) {
    throw new Error('Data inválida para montagem do alerta.');
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

  return {
    assunto: '[DEMONSTRAÇÃO] Falha no processamento de produção - ' + dataTexto,
    corpo:
      'Foi identificada uma inconsistência no processamento.\n\n' +
      'Data: ' + dataTexto + '\n' +
      'Participante: ' + (participante || 'Não identificado') + '\n' +
      'Motivo: ' + (motivo || 'Não informado') + '\n\n' +
      'Este é um alerta preparado para demonstração. Nenhum e-mail foi enviado.',
    destinatarios: destinatarios
  };
}


/**
 * Testa a montagem do alerta sem enviar mensagens.
 */
function testarMontagemAlertaFlog() {
  const alerta = montarAlertaErroFlog(
    new Date('2026-11-06T12:00:00-03:00'),
    'PARTICIPANTE_A',
    'Exemplo de resposta inválida.'
  );

  console.assert(
    alerta.assunto.includes('[DEMONSTRAÇÃO]'),
    'O assunto deve identificar o modo de demonstração.'
  );

  console.assert(
    alerta.corpo.includes('PARTICIPANTE_A'),
    'O participante deve aparecer no alerta.'
  );

  console.assert(
    alerta.corpo.includes('Nenhum e-mail foi enviado'),
    'O alerta deve deixar claro que não houve envio.'
  );

  Logger.log('Teste de montagem de alerta concluído.');
}


/**
 * Processa respostas sem enviar o formulário.
 *
 * Se não houver respostas, prepara valores zerados.
 * Se a resposta selecionada for inválida, interrompe
 * o processamento e prepara um alerta.
 */
function processarRespostasFlogSemEnviar(
  respostas,
  dataProducao,
  horarioCorte
) {
  const selecao = selecionarRespostaPrioritaria(
    respostas,
    horarioCorte
  );

  if (!selecao.sucesso) {
    return selecao;
  }

  let producao;

  if (selecao.situacao === 'SEM_RESPOSTAS') {
    producao = {};

    CONFIG.PRODUTOS.forEach(function(produto) {
      producao[produto] = 0;
    });

  } else {
    const interpretacao = interpretarProducao(selecao.corpo);

    if (!interpretacao.sucesso) {
      const alerta = montarAlertaErroFlog(
        dataProducao,
        selecao.participante,
        interpretacao.motivo
      );

      return {
        sucesso: false,
        situacao: 'RESPOSTA_INVALIDA',
        participante: selecao.participante,
        motivo: interpretacao.motivo,
        alerta: alerta
      };
    }

    producao = interpretacao.valores;
  }

  const campos = prepararRespostaFormulario(
    producao,
    dataProducao
  );

  const respostaFormulario = montarRespostaFormsSemEnviar(campos);

  return {
    sucesso: true,
    situacao: selecao.situacao,
    participante: selecao.participante,
    quantidadeCampos: Object.keys(campos).length,
    respostaFormulario: respostaFormulario,
    valores: producao
  };
}


/**
 * Teste integrado de processamento.
 * Não envia e-mail nem submete formulário.
 */
function testarFluxoIntegradoFlog() {
  const dataTeste = new Date('2026-11-06T12:00:00-03:00');
  const corte = new Date('2026-11-06T16:30:00-03:00');

  const respostaValida = {
    participante: 'PARTICIPANTE_A',
    dataTimestamp: '2026-11-06T15:00:00-03:00',
    corpo:
      'VIDA_UNICO_ANUAL\n10\n' +
      'VIDA_MENSAL\n5\n' +
      'DENTAL_PJ\n2\n' +
      'SAUDE\n3\n' +
      'AUTO\n4\n' +
      'RE\n1\n' +
      'SWISS_RE\n0'
  };

  const resultadoValido = processarRespostasFlogSemEnviar(
    [respostaValida],
    dataTeste,
    corte
  );

  console.assert(
    resultadoValido.sucesso === true,
    'O fluxo válido deve ser processado.'
  );

  console.assert(
    resultadoValido.quantidadeCampos ===
      Object.keys(CONFIG.CAMPOS_FORMULARIO).length,
    'A quantidade de campos deve corresponder à configuração.'
  );

  const respostaInvalida = {
    participante: 'PARTICIPANTE_A',
    dataTimestamp: '2026-11-06T15:00:00-03:00',
    corpo: 'PRODUTO_INEXISTENTE\n10'
  };

  const resultadoInvalido = processarRespostasFlogSemEnviar(
    [respostaInvalida],
    dataTeste,
    corte
  );

  console.assert(
    resultadoInvalido.situacao === 'RESPOSTA_INVALIDA',
    'Uma resposta inválida deve interromper o fluxo.'
  );

  const resultadoSemRespostas = processarRespostasFlogSemEnviar(
    [],
    dataTeste,
    corte
  );

  console.assert(
    resultadoSemRespostas.situacao === 'SEM_RESPOSTAS',
    'A ausência de respostas deve preparar valores zerados.'
  );

  Logger.log('Teste integrado concluído. Nenhum envio foi realizado.');
}
