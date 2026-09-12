# OBD Service

Serviço local, separado do app Next.js, responsável por falar com um adaptador OBD-II (ELM327 ou compatível) via porta serial e expor os dados por HTTP/WebSocket em `localhost:4405`. Roda no mesmo computador em que o adaptador USB está conectado - não é implantado na nuvem.

## Por que um serviço separado, e por que Node.js

Uma conexão serial persistente e um stream de WebSocket não combinam bem com um servidor web de request/resposta, especialmente um que também pode ser implantado no Vercel - este serviço roda só na máquina do usuário, ao lado do carro. Node foi escolhido em vez de Python porque o resto do projeto já é TypeScript (um único ecossistema de ferramentas) e porque `serialport` é um pacote maduro, multiplataforma, com suporte de primeira classe a portas COM no Windows (`SerialPort.list()`) - o requisito de "Windows primeiro" deste projeto.

## Uso

```bash
npm install          # primeira vez
npm run dev           # modo simulador (padrão) - não precisa do carro
```

Variáveis de ambiente:

| Variável | Padrão | Descrição |
|---|---|---|
| `OBD_SERVICE_PORT` | `4405` | Porta HTTP/WS do serviço |
| `OBD_TRANSPORT` | `simulator` | `simulator`, `serial` (hardware real) ou `replay` (reproduz uma sessão gravada) |
| `OBD_SIMULATOR_SCENARIO` | `idle-healthy` | Ver a lista completa em `src/simulator/scenarios.ts` - inclui `idle-healthy`, `lean-mixture-idle`, `rich-mixture-idle`, `misfire-with-dtc`, `cold-start`, `warming-up`, `overheating`, `low-battery-key-on`, `charging-failure-running`, `incoherent-coolant-sensor`, `multiple-dtcs`, `limited-pids`. Pode ser trocada em tempo real via `POST /simulator/scenario`, sem reiniciar o serviço. |
| `OBD_REPLAY_FILE` | - | Obrigatório com `OBD_TRANSPORT=replay`: caminho para um arquivo `.json` salvo via `POST /recording/save` |
| `OBD_RECORDINGS_DIR` | `<pacote>/recordings` | Onde `POST /recording/save` escreve e `GET /recording/list` procura gravações |

## Endpoints

| Rota | Descrição |
|---|---|
| `GET /status` | Estado da conexão, perfil do veículo, último erro |
| `GET /ports` | Portas seriais disponíveis (nunca fixas) |
| `GET /vehicle` | Perfil do veículo conectado (404 se desconectado) |
| `GET /supported-pids` | PIDs confirmados pela ECU |
| `GET /live` | Snapshot atual de todos os PIDs suportados |
| `GET /live/ws` | WebSocket - stream de `/live` a cada 1s |
| `GET /dtc` | Códigos de falha armazenados |
| `GET /freeze-frame` | Dados capturados no momento da falha (404 se não houver) |
| `POST /connect` | `{ "port": "COM4" }` ou `{ "port": "SIMULATOR" }` |
| `POST /disconnect` | Encerra a conexão |
| `GET /simulator/scenarios` | Lista os cenários do simulador disponíveis (404 fora do modo `simulator`) |
| `POST /simulator/scenario` | `{ "scenarioId": "overheating" }` - troca o cenário ativo sem reiniciar (404 fora do modo `simulator`) |
| `GET /recording/current` | `{ "frameCount": N }` - quantos quadros já foram gravados na sessão atual |
| `POST /recording/save` | `{ "label"?: "..." }` - salva a gravação atual em disco (409 se nada foi gravado ainda) |
| `GET /recording/list` | Lista as gravações já salvas em `OBD_RECORDINGS_DIR` |

Não existe (de propósito) nenhum endpoint de escrita - apagar DTC, controlar atuador, gravar parâmetro. Ver `src/transport/OBDTransport.ts` e `src/validation/readOnlyGuard.ts`.

### Gravação e reprodução de sessões (RECORD -> SAVE -> REPLAY)

Toda sessão (simulada ou real) é gravada automaticamente em memória por um `RecordingTransport` que envolve o transporte ativo - o `ConnectionManager` e o gateway HTTP nunca sabem disso, pois `RecordingTransport` implementa a mesma interface `OBDTransport`. Para revisar um caso de diagnóstico depois:

1. **RECORD**: já acontece durante qualquer sessão (`connect`, leituras, DTCs).
2. **SAVE**: `POST /recording/save` grava a sessão atual em `OBD_RECORDINGS_DIR/<id>.json`.
3. **REPLAY**: reinicie o serviço com `OBD_TRANSPORT=replay OBD_REPLAY_FILE=<caminho do arquivo>`. O `ReplayTransport` reproduz exatamente a sequência de respostas gravadas, na ordem original, para cada tipo de leitura - o front-end e o motor de diagnóstico usam a mesma API HTTP de sempre, sem saber que não há hardware nem simulador por trás. Quando a gravação de um tipo de leitura se esgota, o último quadro conhecido é repetido marcado como `stale: true` (nunca finge ser uma leitura nova).

A troca de transporte (simulador/serial/replay) sempre exige reiniciar o processo com uma variável de ambiente diferente - o mesmo mecanismo que já existia para escolher entre simulador e hardware real, não um recurso separado.

## Limitação conhecida

`SerialTransport` (`src/transport/SerialTransport.ts`) segue a documentação pública do protocolo ELM327/SAE J1979, mas **não foi validado contra um adaptador físico** - o ambiente onde este serviço foi desenvolvido não tem porta serial disponível. Antes de confiar nele com o carro real, teste com o adaptador físico e registre o resultado aqui.

## Testes

```bash
npm run test        # vitest - protocolo, simulador, connection manager, gateway, replay, segurança
npx tsc --noEmit     # typecheck
```
