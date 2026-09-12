import { SerialPort } from 'serialport';
import { OBDTransport, OBDRequest, OBDResponse, ConnectionEvent, PortDescriptor } from './OBDTransport';
import { assertReadOnly } from '../validation/readOnlyGuard';
import { ELM327_HANDSHAKE, ELM327_READ_VOLTAGE, ELM327_DESCRIBE_PROTOCOL, buildPidRequest, parseHexResponse } from '../protocol/elm327';

/**
 * Transporte real: fala com um adaptador ELM327 (ou compatível) por porta
 * serial. No Windows aparece como COM3/COM4/etc.; no Linux/macOS como
 * /dev/ttyUSB0, /dev/tty.usbserial-XXXX etc. Nunca fixa uma porta - sempre
 * recebe o path escolhido pelo usuário (ou detectado por listPorts()).
 *
 * AVISO DE VALIDAÇÃO: esta implementação segue a documentação pública do
 * protocolo ELM327 e do padrão OBD-II (SAE J1979), mas não pôde ser
 * validada contra um adaptador USB físico neste ambiente de execução (um
 * container de nuvem sem porta serial). Antes de confiar nela para uso
 * real, teste com o adaptador e o veículo físicos e registre o resultado -
 * ver AGENTS.md, seção "OBD Service".
 */

const RESPONSE_TIMEOUT_MS = 5000;
const PROMPT_CHAR = '>';

export class SerialTransport implements OBDTransport {
  private port: SerialPort | null = null;
  private buffer = '';
  private pendingResolvers: Array<(line: string) => void> = [];
  private listeners: Array<(event: ConnectionEvent) => void> = [];
  private detectedProtocol = 'DESCONHECIDO';

  async listPorts(): Promise<PortDescriptor[]> {
    const ports = await SerialPort.list();
    return ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer,
      vendorId: p.vendorId,
      productId: p.productId,
    }));
  }

  async connect(portPath: string): Promise<void> {
    if (this.port?.isOpen) {
      await this.disconnect();
    }

    await new Promise<void>((resolve, reject) => {
      const port = new SerialPort({ path: portPath, baudRate: 38400, autoOpen: false });
      port.open(err => {
        if (err) {
          this.emit({ type: 'ERROR', message: `Não foi possível abrir ${portPath}: ${err.message}` });
          reject(new Error('PORT_OPEN_FAILED'));
          return;
        }
        this.port = port;
        port.on('data', (chunk: Buffer) => this.onData(chunk));
        port.on('close', () => this.emit({ type: 'DISCONNECTED', reason: 'LOST' }));
        port.on('error', (e) => this.emit({ type: 'ERROR', message: e.message }));
        resolve();
      });
    });

    try {
      for (const command of ELM327_HANDSHAKE) {
        await this.writeAndAwaitPrompt(command);
      }
      const protocolLine = await this.writeAndAwaitPrompt(ELM327_DESCRIBE_PROTOCOL);
      this.detectedProtocol = protocolLine.trim() || 'DESCONHECIDO';
    } catch (e) {
      await this.disconnect();
      throw new Error('PROTOCOL_HANDSHAKE_FAILED');
    }

    this.emit({ type: 'CONNECTED', port: portPath, protocol: this.detectedProtocol });
  }

  async disconnect(): Promise<void> {
    if (!this.port) return;
    const port = this.port;
    this.port = null;
    await new Promise<void>((resolve) => {
      if (!port.isOpen) return resolve();
      port.close(() => resolve());
    });
    this.emit({ type: 'DISCONNECTED', reason: 'USER_REQUEST' });
  }

  isConnected(): boolean {
    return !!this.port?.isOpen;
  }

  onEvent(listener: (event: ConnectionEvent) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: ConnectionEvent) {
    for (const listener of this.listeners) listener(event);
  }

  private onData(chunk: Buffer) {
    this.buffer += chunk.toString('ascii');
    const promptIndex = this.buffer.indexOf(PROMPT_CHAR);
    if (promptIndex !== -1) {
      const response = this.buffer.slice(0, promptIndex);
      this.buffer = this.buffer.slice(promptIndex + 1);
      const resolver = this.pendingResolvers.shift();
      if (resolver) resolver(response);
    }
  }

  private writeAndAwaitPrompt(command: string): Promise<string> {
    if (!this.port) throw new Error('NOT_CONNECTED');
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.pendingResolvers.indexOf(wrappedResolve);
        if (index !== -1) this.pendingResolvers.splice(index, 1);
        reject(new Error('TIMEOUT'));
      }, RESPONSE_TIMEOUT_MS);

      const wrappedResolve = (line: string) => {
        clearTimeout(timer);
        resolve(line);
      };
      this.pendingResolvers.push(wrappedResolve);
      this.port!.write(`${command}\r`);
    });
  }

  async send(rawRequest: unknown): Promise<OBDResponse> {
    const request = assertReadOnly(rawRequest) as OBDRequest;

    if (!this.isConnected()) {
      return { ok: false, error: 'NO_RESPONSE' };
    }

    try {
      const line = await this.buildAndSend(request);
      const bytes = parseHexResponse(line);
      if (bytes === null) {
        return { ok: false, error: 'PROTOCOL_ERROR' };
      }
      return { ok: true, bytes };
    } catch (e) {
      if (e instanceof Error && e.message === 'TIMEOUT') {
        return { ok: false, error: 'TIMEOUT' };
      }
      return { ok: false, error: 'NO_RESPONSE' };
    }
  }

  private async buildAndSend(request: OBDRequest): Promise<string> {
    switch (request.kind) {
      case 'READ_VOLTAGE':
        return this.writeAndAwaitPrompt(ELM327_READ_VOLTAGE);
      case 'READ_PROTOCOL':
        return this.writeAndAwaitPrompt(ELM327_DESCRIBE_PROTOCOL);
      case 'READ_PID':
        return this.writeAndAwaitPrompt(buildPidRequest(request.mode, request.pid));
      case 'READ_SUPPORTED_PIDS':
        return this.writeAndAwaitPrompt(buildPidRequest('01', request.bank));
      case 'READ_DTC':
        return this.writeAndAwaitPrompt(buildPidRequest(request.mode));
      case 'READ_FREEZE_FRAME':
        // Freeze frame vem do Modo 02; o PID específico é resolvido pelo
        // ConnectionManager, que já sabe quais PIDs a ECU suporta.
        return this.writeAndAwaitPrompt(buildPidRequest('02', '00'));
      default:
        throw new Error('UNSUPPORTED_REQUEST');
    }
  }
}
