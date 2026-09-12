import { DiagnosticCase, DiagnosticSample, PidShortName, PidValue } from './types';

export function findSample(input: DiagnosticCase, label: DiagnosticSample['label']): DiagnosticSample | undefined {
  return input.samples.find(s => s.label === label);
}

export function getPid(sample: DiagnosticSample | undefined, name: PidShortName): PidValue | undefined {
  return sample?.pids[name];
}

export function isNumericOk(pid: PidValue | undefined): pid is PidValue & { value: number } {
  return !!pid && pid.status === 'OK' && typeof pid.value === 'number' && Number.isFinite(pid.value);
}

export function engineIsRunning(sample: DiagnosticSample | undefined): boolean {
  const rpm = getPid(sample, 'RPM');
  return isNumericOk(rpm) && rpm.value > 0;
}

export function hasDtcMatching(input: DiagnosticCase, pattern: RegExp): boolean {
  return input.dtcs.some(d => pattern.test(d.code));
}
