# ENVIO F-LOG AUTO

**Automação de processos com Google Apps Script, JavaScript, Gmail e Google Forms.**

## Sobre o projeto

O ENVIO F-LOG AUTO é um projeto demonstrativo de automação desenvolvido com Google Apps Script.

A solução automatiza etapas de coleta, interpretação, validação e registro de informações recebidas por e-mail, integrando serviços do Google.

O objetivo é demonstrar como processos manuais podem ser transformados em fluxos automatizados, organizados e confiáveis.

> Esta versão é destinada a portfólio e utiliza dados fictícios. Não contém integrações, identificadores ou informações confidenciais do ambiente original.

## Funcionalidades

- Envio automatizado de lembretes por e-mail.
- Leitura e identificação de respostas recebidas.
- Seleção de respostas conforme regras de prioridade.
- Interpretação e validação de dados.
- Integração com Google Forms.
- Tratamento de respostas inválidas.
- Notificações de inconsistências.
- Controle de execução e prevenção de duplicidade.
- Modo de simulação para testes.

## Tecnologias utilizadas

- JavaScript
- Google Apps Script
- GmailApp
- FormApp
- Google Forms
- PropertiesService
- LockService
- Time-based Triggers

## Fluxo de funcionamento

1. O sistema prepara e envia um lembrete automático.
2. Os participantes enviam suas respostas por e-mail.
3. O sistema identifica as respostas válidas dentro do período definido.
4. As regras de prioridade determinam qual resposta será utilizada.
5. Os dados são interpretados e validados.
6. Em caso de inconsistência, o sistema interrompe o processamento e prepara uma notificação.
7. Quando os dados são válidos, o sistema realiza a integração com o formulário.
8. O controle de execução evita registros duplicados.

## Arquitetura do projeto

| Arquivo | Responsabilidade |
|---|---|
| `Config.gs` | Configurações gerais |
| `Forms_Service.gs` | Integração com serviços Google |
| `Producao.gs` | Interpretação e validação dos dados |
| `Agendamentos.gs` | Agendamentos e execução automática |
| `Controle_Envios.gs` | Controle de execução e duplicidade |
| `WebApp.gs` | Recursos relacionados à aplicação web |
| `Utils.gs` | Funções auxiliares |

## Segurança e confiabilidade

O projeto demonstra práticas importantes de desenvolvimento:

- Validação de entradas.
- Tratamento de exceções.
- Controle de concorrência com `LockService`.
- Registro de estados de processamento.
- Proteção contra execuções duplicadas.
- Separação entre configurações e regras de negócio.
- Simulação de operações antes da execução real.

## Execução e agendamento

A versão demonstrativa utiliza acionadores temporizados do Google Apps Script.

Os horários são configuráveis e os acionadores estão sujeitos às variações de execução da plataforma.

## Status do projeto

**Versão de portfólio — 1.0**

- [x] Estrutura modular.
- [x] Integração com Gmail e Google Forms.
- [x] Regras de seleção.
- [x] Validação de dados.
- [x] Tratamento de respostas inválidas.
- [x] Proteção contra duplicidade.
- [x] Testes em modo de simulação.
- [ ] Documentação de instalação da versão demonstrativa.
- [ ] Demonstração pública com dados fictícios.

## Desenvolvedor

**Welinton Ferraz Franson**

Projeto desenvolvido como iniciativa prática de estudo e aplicação de JavaScript e Google Apps Script.

**Objetivo:** desenvolver soluções que transformem processos manuais em fluxos automatizados, eficientes e seguros.
