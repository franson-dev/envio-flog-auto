
/**
 * ENVIO F-LOG AUTO
 * Serviço de integração com Gmail e Google Forms.
 *
 * Versão pública para portfólio.
 * Nenhuma submissão é realizada neste arquivo.
 */

// =====================================================
// PROTEÇÃO E CONFIGURAÇÃO
// =====================================================

function exigirIntegracaoFlog(tipo) {
  const integracoes = CONFIG.INTEGRACOES || {};

  if (integracoes[tipo] !== true) {
    throw new Error(
      'Integração ' + tipo +
      ' desativada. Configure o ambiente antes de executar.'
    );
  }
}

function obterFormularioConfigurado() {
  exigirIntegracaoFlog('FORMS_ATIVO');

  const id = CONFIG.FORMULARIO.ID;

  if (
    !id ||
    id === 'INSIRA_O_ID_DO_SEU_FORMULARIO_DE_TESTE'
  ) {
    throw new Error(
      'Configure o ID do seu Google Forms de demonstração.'
    );
  }

  return FormApp.openById(id);
}

// =====================================================
// CONSULTA DO GOOGLE FORMS
// =====================================================

function testarAcessoFormulario() {
  const formulario = obterFormularioConfigurado();

  const resultado = {
    sucesso: true,
    titulo: formulario.getTitle(),
    aceitaRespostas: formulario.isAcceptingResponses(),
    quantidadeItens: formulario.getItems().length
  };

  Logger.log(JSON.stringify(resultado, null, 2));

  return resultado;
}

function listarCamposFormulario() {
  const formulario = obterFormularioConfigurado();

  const campos = formulario.getItems().map(
    (item, indice) => ({
      numero: indice + 1,
      titulo: item.getTitle(),
      id: item.getId(),
      tipo: item.getType().toString()
    })
  );

  Logger.log(JSON.stringify(campos, null, 2));

  return campos;
}

function listarOpcoesFormulario() {
  const formulario = obterFormularioConfigurado();

  const resultado = formulario.getItems().map(item => {
    const tipo = item.getType();
    let opcoes = [];
    let obrigatorio = false;

    if (tipo === FormApp.ItemType.LIST) {
      const campo = item.asListItem();
      opcoes = campo.getChoices().map(
        escolha => escolha.getValue()
      );
      obrigatorio = campo.isRequired();
    } else if (
      tipo === FormApp.ItemType.MULTIPLE_CHOICE
    ) {
      const campo = item.asMultipleChoiceItem();
      opcoes = campo.getChoices().map(
        escolha => escolha.getValue()
      );
      obrigatorio = campo.isRequired();
    } else if (tipo === FormApp.ItemType.DATE) {
      obrigatorio = item.asDateItem().isRequired();
    } else if (tipo === FormApp.ItemType.TEXT) {
      obrigatorio = item.asTextItem().isRequired();
    }

    return {
      campo: item.getTitle(),
      tipo: tipo.toString(),
      obrigatorio: obrigatorio,
      opcoes: opcoes
    };
  });

  Logger.log(JSON.stringify(resultado, null, 2));

  return resultado;
}

// =====================================================
// CONSULTA DE RESPOSTAS NO GMAIL
// =====================================================

function consultarRespostasDoDia() {
  exigirIntegracaoFlog('GMAIL_ATIVO');

  const fuso = CONFIG.FUSO_HORARIO;
  const agora = new Date();

  const dataHoje = Utilities.formatDate(
    agora,
    fuso,
    'yyyy/MM/dd'
  );

  const dataCorte = Utilities.formatDate(
    agora,
    fuso,
    'yyyy-MM-dd'
  );

  const identificador = CONFIG.IDENTIFICADOR_EMAIL;

  if (!identificador) {
    throw new Error(
      'Identificador de e-mail não configurado.'
    );
  }

  const inicioDia = Utilities.parseDate(
    dataCorte + ' 00:00:00',
    fuso,
    'yyyy-MM-dd HH:mm:ss'
  );

  const horarioCorte = Utilities.parseDate(
    dataCorte + ' ' + CONFIG.HORARIOS.ENVIO + ':00',
    fuso,
    'yyyy-MM-dd HH:mm:ss'
  );

  const emails = Object.entries(CONFIG.EMAILS);

  const consulta =
    'subject:"' + identificador + '" after:' +
    Utilities.formatDate(
      inicioDia,
      fuso,
      'yyyy/MM/dd'
    );

  const threads = GmailApp.search(consulta);
  const respostas = [];

  threads.forEach(thread => {
    thread.getMessages().forEach(mensagem => {
      const timestamp = mensagem.getDate().getTime();

      if (timestamp > horarioCorte.getTime()) return;

      const assunto = mensagem.getSubject() || '';

      if (!assunto.includes(identificador)) return;

      if (
        assunto.toUpperCase().includes(
          '[TESTE - NÃO RESPONDER]'
        )
      ) {
        return;
      }

      const corpoOriginal = mensagem.getPlainBody();

      // Evita interpretar o próprio lembrete como resposta.
      if (
        corpoOriginal.includes(
          'FORMATO DE PREENCHIMENTO:'
        )
      ) {
        return;
      }

      const remetente = mensagem.getFrom();

      const correspondencia = remetente.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
      );

      if (!correspondencia) return;

      const emailRemetente =
        correspondencia[0].toLowerCase();

      const participante = emails.find(
        ([nome, email]) =>
          email.toLowerCase() === emailRemetente
      );

      if (!participante) return;

      const [nome] = participante;

      const dataLocal = Utilities.formatDate(
        mensagem.getDate(),
        fuso,
        'yyyy/MM/dd'
      );

      if (dataLocal !== dataHoje) return;

      respostas.push({
        participante: nome,
        remetente: emailRemetente,
        recebidaEm: Utilities.formatDate(
          mensagem.getDate(),
          fuso,
          'dd/MM/yyyy HH:mm:ss'
        ),
        dataTimestamp: timestamp,
        assunto: assunto,
        corpo: limparCorpoEmailFlog(corpoOriginal)
      });
    });
  });

  respostas.sort(
    (a, b) => a.dataTimestamp - b.dataTimestamp
  );

  Logger.log(
    'Identificador pesquisado: ' + identificador
  );

  Logger.log(
    'Total de respostas: ' + respostas.length
  );

  return respostas;
}

// =====================================================
// TESTE DO FLUXO DE INTERPRETAÇÃO
// =====================================================

function testarFluxoCompletoFlog() {
  const fuso = CONFIG.FUSO_HORARIO;
  const respostas = consultarRespostasDoDia();

  const dataHoje = Utilities.formatDate(
    new Date(),
    fuso,
    'yyyy-MM-dd'
  );

  const corte = Utilities.parseDate(
    dataHoje + ' ' + CONFIG.HORARIOS.ENVIO + ':00',
    fuso,
    'yyyy-MM-dd HH:mm:ss'
  );

  const selecao = selecionarRespostaPrioritaria(
    respostas,
    corte
  );

  Logger.log(
    'SELEÇÃO: ' + JSON.stringify(selecao, null, 2)
  );

  if (selecao.situacao === 'SEM_RESPOSTAS') {
    return selecao;
  }

  const producao = interpretarProducao(
    selecao.corpo
  );

  Logger.log(
    'PRODUÇÃO: ' + JSON.stringify(producao, null, 2)
  );

  if (!producao.sucesso) {
    throw new Error(
      'Produção inválida: ' +
      producao.erros.join(' | ')
    );
  }

  return {
    selecao: selecao,
    producao: producao
  };
}

// =====================================================
// PREPARAÇÃO DOS DADOS
// =====================================================

function prepararRespostaFormulario(
  producao,
  dataProducao
) {
  if (!producao || !producao.sucesso) {
    throw new Error('Produção inválida.');
  }

  const data = dataProducao instanceof Date
    ? dataProducao
    : new Date(dataProducao);

  if (isNaN(data.getTime())) {
    throw new Error('Data de produção inválida.');
  }

  const fuso = CONFIG.FUSO_HORARIO;

  const mes = Utilities.formatDate(
    data,
    fuso,
    'MMMM'
  );

  const meses = {
    january: 'Janeiro',
    february: 'Fevereiro',
    march: 'Março',
    april: 'Abril',
    may: 'Maio',
    june: 'Junho',
    july: 'Julho',
    august: 'Agosto',
    september: 'Setembro',
    october: 'Outubro',
    november: 'Novembro',
    december: 'Dezembro'
  };

  const mesPortugues = meses[mes.toLowerCase()];

  if (!mesPortugues) {
    throw new Error('Mês não identificado.');
  }

  const campos = CONFIG.CAMPOS_FORMULARIO;
  const padrao = CONFIG.FORMULARIO_PADRAO;
  const valores = producao.valores;

  return {
    [campos.DATA]: data,
    [campos.MES]: mesPortugues,
    [campos.ANO]: padrao.ANO,
    [campos.CORRETORA]: padrao.CORRETORA,
    [campos.PRODUTOR]: padrao.PRODUTOR,
    [campos.SEGMENTO]: padrao.SEGMENTO,
    [campos.AGENCIA]: padrao.AGENCIA,
    [campos.VIDA_UNICO_ANUAL]:
      String(valores.VIDA_UNICO_ANUAL),
    [campos.VIDA_MENSAL]:
      String(valores.VIDA_MENSAL),
    [campos.DENTAL_PJ]:
      String(valores.DENTAL_PJ),
    [campos.SAUDE]:
      String(valores.SAUDE),
    [campos.AUTO]:
      String(valores.AUTO),
    [campos.RE]:
      String(valores.RE),
    [campos.SWISS_RE]:
      String(valores.SWISS_RE)
  };
}

// =====================================================
// VALIDAÇÃO DOS CAMPOS DO FORMULÁRIO
// =====================================================

function validarRespostaNoFormulario(resposta) {
  const formulario = obterFormularioConfigurado();
  const itens = formulario.getItems();
  const campos = CONFIG.CAMPOS_FORMULARIO;

  const tiposEsperados = {
    [campos.DATA]: 'DATE',
    [campos.MES]: 'LIST',
    [campos.ANO]: 'MULTIPLE_CHOICE',
    [campos.CORRETORA]: 'LIST',
    [campos.PRODUTOR]: 'MULTIPLE_CHOICE',
    [campos.SEGMENTO]: 'MULTIPLE_CHOICE',
    [campos.AGENCIA]: 'LIST',
    [campos.VIDA_UNICO_ANUAL]: 'TEXT',
    [campos.VIDA_MENSAL]: 'TEXT',
    [campos.DENTAL_PJ]: 'TEXT',
    [campos.SAUDE]: 'TEXT',
    [campos.AUTO]: 'TEXT',
    [campos.RE]: 'TEXT',
    [campos.SWISS_RE]: 'TEXT'
  };

  const relatorio = [];

  Object.entries(tiposEsperados).forEach(
    ([id, tipoEsperado]) => {
      const item = itens.find(
        campo => String(campo.getId()) === id
      );

      if (!item) {
        relatorio.push({
          id: id,
          aprovado: false,
          motivo: 'Campo não encontrado.'
        });
        return;
      }

      const tipoReal = item.getType().toString();

      if (tipoReal !== tipoEsperado) {
        relatorio.push({
          id: id,
          aprovado: false,
          motivo: 'Tipo de campo incorreto.'
        });
        return;
      }

      const valor = resposta[id];
      let valido = valor !== undefined && valor !== null;

      if (tipoEsperado === 'LIST' && valido) {
        valido = item.asListItem()
          .getChoices()
          .some(opcao => opcao.getValue() === valor);
      }

      if (
        tipoEsperado === 'MULTIPLE_CHOICE' &&
        valido
      ) {
        valido = item.asMultipleChoiceItem()
          .getChoices()
          .some(opcao => opcao.getValue() === valor);
      }

      if (tipoEsperado === 'DATE' && valido) {
        valido = valor instanceof Date &&
          !isNaN(valor.getTime());
      }

      relatorio.push({
        id: id,
        campo: item.getTitle(),
        aprovado: valido,
        motivo: valido
          ? 'Campo validado.'
          : 'Valor ausente ou não aceito.'
      });
    }
  );

  const aprovados = relatorio.filter(
    item => item.aprovado
  ).length;

  const resultado = {
    totalCampos: relatorio.length,
    aprovados: aprovados,
    reprovados: relatorio.length - aprovados,
    sucesso: aprovados === relatorio.length,
    detalhes: relatorio
  };

  Logger.log(JSON.stringify(resultado, null, 2));

  if (!resultado.sucesso) {
    throw new Error(
      'Validação reprovada: ' +
      resultado.reprovados + ' campo(s).'
    );
  }

  return resultado;
}

// =====================================================
// MONTAGEM DE RESPOSTA SEM SUBMISSÃO
// =====================================================

function montarRespostaFormsSemEnviar(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new Error('Dados inválidos.');
  }

  const formulario = obterFormularioConfigurado();
  const resposta = formulario.createResponse();
  const itens = formulario.getItems();
  const campos = CONFIG.CAMPOS_FORMULARIO;

  const tipos = {
    [campos.DATA]: FormApp.ItemType.DATE,
    [campos.MES]: FormApp.ItemType.LIST,
    [campos.ANO]: FormApp.ItemType.MULTIPLE_CHOICE,
    [campos.CORRETORA]: FormApp.ItemType.LIST,
    [campos.PRODUTOR]: FormApp.ItemType.MULTIPLE_CHOICE,
    [campos.SEGMENTO]: FormApp.ItemType.MULTIPLE_CHOICE,
    [campos.AGENCIA]: FormApp.ItemType.LIST,
    [campos.VIDA_UNICO_ANUAL]: FormApp.ItemType.TEXT,
    [campos.VIDA_MENSAL]: FormApp.ItemType.TEXT,
    [campos.DENTAL_PJ]: FormApp.ItemType.TEXT,
    [campos.SAUDE]: FormApp.ItemType.TEXT,
    [campos.AUTO]: FormApp.ItemType.TEXT,
    [campos.RE]: FormApp.ItemType.TEXT,
    [campos.SWISS_RE]: FormApp.ItemType.TEXT
  };

  Object.entries(tipos).forEach(
    ([id, tipoEsperado]) => {
      const item = itens.find(
        campo => String(campo.getId()) === id
      );

      if (!item || item.getType() !== tipoEsperado) {
        throw new Error(
          'Campo ausente ou tipo incorreto: ' + id
        );
      }

      const valor = dados[id];

      if (valor === undefined || valor === null) {
        throw new Error('Valor ausente no campo: ' + id);
      }

      let respostaItem;

      switch (tipoEsperado) {
        case FormApp.ItemType.DATE:
          respostaItem = item.asDateItem()
            .createResponse(valor);
          break;

        case FormApp.ItemType.LIST:
          respostaItem = item.asListItem()
            .createResponse(valor);
          break;

        case FormApp.ItemType.MULTIPLE_CHOICE:
          respostaItem = item.asMultipleChoiceItem()
            .createResponse(valor);
          break;

        case FormApp.ItemType.TEXT:
          respostaItem = item.asTextItem()
            .createResponse(valor);
          break;

        default:
          throw new Error('Tipo não suportado: ' + tipoEsperado);
      }

      resposta.withItemResponse(respostaItem);
    }
  );

  Logger.log(
    'Resposta montada com ' +
    resposta.getItemResponses().length +
    ' campos.'
  );

  return resposta;
}
