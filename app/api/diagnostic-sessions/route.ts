import { NextRequest, NextResponse } from 'next/server';
import { createDiagnosticSession, getDiagnosticSessions } from '../../../lib/selectors';

export async function GET() {
  const sessions = await getDiagnosticSessions();
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || typeof body.port !== 'string') {
    return NextResponse.json({ error: 'PAYLOAD_INVALIDO' }, { status: 400 });
  }
  try {
    const session = await createDiagnosticSession({
      id: body.id,
      startedAt: body.startedAt ?? new Date().toISOString(),
      endedAt: body.endedAt,
      port: body.port,
      protocol: body.protocol,
      ecuResponded: Boolean(body.ecuResponded),
      supportedPids: Array.isArray(body.supportedPids) ? body.supportedPids : [],
      dtcs: Array.isArray(body.dtcs) ? body.dtcs : [],
      freezeFrame: body.freezeFrame ?? null,
      finalSamples: body.finalSamples ?? null,
      symptomsReported: body.symptomsReported,
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'ERRO_AO_SALVAR_SESSAO' }, { status: 500 });
  }
}
