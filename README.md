# ENVIO F-LOG AUTO

**Automação de registro e envio diário de produção utilizando Google Apps Script.**

## Sobre o projeto

O ENVIO F-LOG AUTO é um projeto de automação desenvolvido para simplificar e padronizar o processo diário de coleta, validação e registro de produção em um Google Forms.

A solução utiliza Google Apps Script para integrar Gmail e Google Forms, reduzindo tarefas manuais e prevenindo inconsistências e envios duplicados.

## Objetivos

- Automatizar o lembrete diário de produção.
- Coletar respostas por e-mail.
- Identificar o participante responsável conforme regras de prioridade.
- Validar os produtos e seus respectivos valores.
- Preparar automaticamente os dados para o Google Forms.
- Registrar produção zerada quando não houver respostas.
- Impedir envios duplicados.
- Notificar os participantes quando houver respostas inválidas.

## Tecnologias utilizadas

- Google Apps Script
- JavaScript
- GmailApp
- FormApp
- Google Forms
- Google Sheets / Script Properties
- Time-based Triggers
- LockService

## Funcionamento

1. O sistema programa um lembrete diário às 16h15.
2. Os participantes respondem ao e-mail utilizando o formato estabelecido.
3. Às 16h30, o sistema encerra a coleta.
4. As respostas são analisadas conforme as regras de prioridade.
5. Os valores passam por validação.
6. Os dados são preparados para o Google Forms.
7. O sistema registra o envio e protege contra duplicidade.

**Regras de seleção:**

- Vanda possui prioridade absoluta.
- Sem resposta da Vanda, é selecionada a resposta mais recente entre os demais participantes.
- Respostas posteriores ao horário de corte são ignoradas.
- As produções nunca são somadas ou misturadas.

## Estrutura do projeto

```text
ENVIO-FLOG-AUTO/
│
├── Config.gs
├── Forms_Service.gs
├── Producao.gs
├── Agendamentos.gs
├── Controle_Envios.gs
├── WebApp.gs
├── Utils.gs
│
└── README.md
```

## Segurança e confiabilidade

O projeto possui mecanismos de proteção:

- Controle de execução por data.
- Bloqueio de envios duplicados.
- Validação dos dados recebidos.
- Registro de estados de processamento.
- Tratamento de falhas com necessidade de conferência manual.
- Modo de simulação para testes sem submissão real.

## Horários de execução

| Etapa                   | Horário          |
| ----------------------- | ---------------- |
| Lembrete                | 16h15            |
| Fechamento              | 16h30            |
| Frequência do acionador | A cada 5 minutos |
| Dias de execução        | Segunda a sexta  |

*Os horários dos acionadores do Google Apps Script são aproximados.*

## Status do projeto

**Versão inicial — 1.0**

- [x] Estrutura principal desenvolvida.
- [x] Integração com Google Forms.
- [x] Leitura de respostas pelo Gmail.
- [x] Regras de prioridade.
- [x] Validação de produção.
- [x] Proteção contra duplicidade.
- [x] Testes em modo de simulação.
- [x] Configuração do acionador.
- [x] Ativação do modo real.
- [ ] Confirmação do primeiro ciclo real de operação.

## Desenvolvedor

Projeto desenvolvido por **Welinton Ferraz Franson**, como iniciativa prática de estudo e aplicação de automação com JavaScript e Google Apps Script.

**Objetivo:** transformar processos operacionais manuais em soluções automatizadas, seguras e eficientes.
