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
| `OBD_TRANSPORT` | `simulator` | `simulator` ou `serial` (hardware real) |
| `OBD_SIMULATOR_SCENARIO` | `idle-healthy` | `idle-healthy`, `lean-mixture-idle` ou `misfire-with-dtc` (ver `src/simulator/scenarios.ts`) |

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

Não existe (de propósito) nenhum endpoint de escrita - apagar DTC, controlar atuador, gravar parâmetro. Ver `src/transport/OBDTransport.ts` e `src/validation/readOnlyGuard.ts`.

## Limitação conhecida

`SerialTransport` (`src/transport/SerialTransport.ts`) segue a documentação pública do protocolo ELM327/SAE J1979, mas **não foi validado contra um adaptador físico** - o ambiente onde este serviço foi desenvolvido não tem porta serial disponível. Antes de confiar nele com o carro real, teste com o adaptador físico e registre o resultado aqui.

## Testes

```bash
npm run test        # vitest - protocolo, simulador, connection manager, segurança
npx tsc --noEmit     # typecheck
```
