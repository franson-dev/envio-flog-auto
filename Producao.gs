
/**
 * ENVIO F-LOG AUTO
 * Módulo de interpretação e validação de dados.
 *
 * Responsabilidades:
 * - Normalizar nomes de produtos.
 * - Interpretar valores recebidos por e-mail.
 * - Identificar informações inválidas.
 * - Impedir produtos duplicados.
 * - Limpar assinaturas de mensagens.
 *
 * Este módulo não realiza envios ou submissões.
 */

const MAPA_PRODUTOS_FLOG = {
  'VIDA UNICO ANUAL': 'VIDA_UNICO_ANUAL',
  'VIDA UNICO/ANUAL': 'VIDA_UNICO_ANUAL',
  'VIDA MENSAL': 'VIDA_MENSAL',
  'DENTAL PJ': 'DENTAL_PJ',
  'SAUDE': 'SAUDE',
  'AUTO': 'AUTO',
  'RE': 'RE',
  'SWISS RE': 'SWISS_RE'
};

// =====================================================
// NORMALIZAÇÃO
// =====================================================

function normalizarProdutoFlog(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// =====================================================
// INTERPRETAÇÃO DA PRODUÇÃO
// =====================================================

function interpretarProducao(emailTexto) {
  const linhas = String(emailTexto || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(linha => linha.trim())
    .filter(linha => linha !== '');

  const valores = {};

  CONFIG.PRODUTOS.forEach(produto => {
    valores[produto] = 0;
  });

  const erros = [];
  const produtosEncontrados = [];

  if (linhas.length === 0) {
    return {
      sucesso: false,
      valores: valores,
      produtosEncontrados: [],
      erros: ['Mensagem sem informações de produção.']
    };
  }

  if (linhas.length % 2 !== 0) {
    erros.push(
      'Formato incompleto: cada produto precisa ter seu valor na linha seguinte.'
    );
  }

  for (let i = 0; i < linhas.length - 1; i += 2) {
    const nomeInformado = normalizarProdutoFlog(
      linhas[i]
    );

    const produto = MAPA_PRODUTOS_FLOG[nomeInformado];
    const valorInformado = linhas[i + 1];

    if (!produto || !CONFIG.PRODUTOS.includes(produto)) {
      erros.push(
        'Produto não reconhecido ou não configurado: ' +
        linhas[i]
      );
      continue;
    }

    if (!/^\d+$/.test(valorInformado)) {
      erros.push(
        'Valor inválido para ' + linhas[i] +
        ': "' + valorInformado +
        '". Utilize somente números inteiros, sem pontos ou vírgulas.'
      );
      continue;
    }

    if (produtosEncontrados.includes(produto)) {
      erros.push(
        'Produto informado mais de uma vez: ' +
        linhas[i]
      );
      continue;
    }

    const valor = Number(valorInformado);

    if (!Number.isSafeInteger(valor)) {
      erros.push(
        'Valor fora do limite permitido: ' +
        valorInformado
      );
      continue;
    }

    valores[produto] = valor;
    produtosEncontrados.push(produto);
  }

  return {
    sucesso:
      erros.length === 0 &&
      produtosEncontrados.length > 0,
    valores: valores,
    produtosEncontrados: produtosEncontrados,
    erros: erros
  };
}

// =====================================================
// TESTES DO INTERPRETADOR
// =====================================================

function testarInterpretadorProducao() {
  const exemplo = `
Auto
1250

Saúde
3500

Vida Mensal
850
`;

  const resultado = interpretarProducao(exemplo);

  Logger.log(JSON.stringify(resultado, null, 2));

  return resultado;
}

function testarProtecoesProducao() {
  const testes = [
    {
      nome: 'Valor com pontuação',
      texto: 'Auto\n1.250,00',
      devePassar: false
    },
    {
      nome: 'Produto duplicado',
      texto: 'Auto\n1250\nAuto\n800',
      devePassar: false
    },
    {
      nome: 'Produto desconhecido',
      texto: 'Residencial\n500',
      devePassar: false
    },
    {
      nome: 'Resposta incompleta',
      texto: 'Auto',
      devePassar: false
    },
    {
      nome: 'Resposta válida',
      texto: 'Auto\n1250\nSaúde\n3500',
      devePassar: true
    }
  ];

  const resultados = testes.map(teste => {
    const resultado = interpretarProducao(
      teste.texto
    );

    return {
      teste: teste.nome,
      esperado: teste.devePassar,
      obtido: resultado.sucesso,
      aprovado:
        resultado.sucesso === teste.devePassar,
      erros: resultado.erros
    };
  });

  Logger.log(JSON.stringify(resultados, null, 2));

  const falhas = resultados.filter(
    resultado => !resultado.aprovado
  );

  if (falhas.length > 0) {
    throw new Error(
      'Testes reprovados: ' +
      falhas.map(f => f.teste).join(', ')
    );
  }

  Logger.log(
    'TODOS OS TESTES DE PROTEÇÃO FORAM APROVADOS.'
  );

  return resultados;
}

// =====================================================
// LIMPEZA DAS MENSAGENS
// =====================================================

function limparCorpoEmailFlog(texto) {
  let corpo = String(texto || '')
    .replace(/\r/g, '');

  const marcador = /\batenciosamente\b/i;
  const correspondencia = marcador.exec(corpo);

  if (correspondencia) {
    corpo = corpo.substring(
      0,
      correspondencia.index
    );
  }

  // Remove o separador automático de assinatura.
  corpo = corpo.replace(/\n\s*--\s*$/, '');

  return corpo.trim();
}

// =====================================================
// TESTE DA LIMPEZA
// =====================================================

function testarLimpezaEmailFlog() {
  const exemplo =
    'Auto\n1250\n\nSaúde\n3500\n\nVida Mensal\n850\n\n' +
    'Atenciosamente,\nParticipante A\nAviso legal';

  const resultado = limparCorpoEmailFlog(exemplo);

  const esperado =
    'Auto\n1250\n\nSaúde\n3500\n\nVida Mensal\n850';

  Logger.log(resultado);

  if (resultado !== esperado) {
    throw new Error(
      'Falha no teste de limpeza da mensagem.'
    );
  }

  Logger.log('TESTE DE LIMPEZA APROVADO.');

  return resultado;
}
