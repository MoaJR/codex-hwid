import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Contrato estático das mutações da Fase 5B: origem canônica antes da sessão,
// guarda de permissão, limite de taxa e resposta sem cache. Impede que uma rota
// nova da solicitação de horário seja criada sem os controles obrigatórios.
const mutations=[
  'src/app/api/paciente/appointment-requests/route.ts',
  'src/app/api/paciente/appointment-requests/[id]/withdraw/route.ts',
  'src/app/api/paciente/appointments/[id]/cancel/route.ts',
  'src/app/api/medico/appointment-requests/[id]/approve/route.ts',
  'src/app/api/medico/appointment-requests/[id]/reject/route.ts',
];
const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

for(const file of mutations){
  test(`${file} exige origem, guarda, limite de taxa e é dinâmica`,()=>{
    const source=read(file);
    assert.match(source,/export async function POST/,'mutação só por POST');
    assert.doesNotMatch(source,/export async function (GET|PUT|PATCH|DELETE)/,'nenhum outro método');
    assert.match(source,/export const dynamic='force-dynamic'/);
    assert.match(source,/validateSchedulingOrigin\(request\)/);
    assert.match(source,/enforceSchedulingRateLimit\(/);
    assert.match(source,/schedulingException\(error\)/,'erros traduzidos para resposta estável');
    const origin=source.indexOf('validateSchedulingOrigin(request)');
    const guard=source.search(/await require(Patient)?SchedulingApi\(/);
    assert.ok(origin>=0&&guard>origin,'a origem é validada antes de resolver a sessão');
  });
}

test('criação da solicitação exige Idempotency-Key e não aceita identidade do cliente',()=>{
  const source=read('src/app/api/paciente/appointment-requests/route.ts');
  assert.match(source,/validateIdempotencyKey\(request\.headers\.get\('idempotency-key'\)\)/);
  assert.match(source,/access\.context\.actor\.userId/,'titular vem da sessão');
  assert.doesNotMatch(source,/patientId|userId\s*:\s*body|searchParams/,'nada de identidade vinda do cliente');
});

test('a leitura da fila da equipe é só GET e protegida por appointment.read',()=>{
  const source=read('src/app/api/medico/appointment-requests/route.ts');
  assert.match(source,/export async function GET/);
  assert.doesNotMatch(source,/export async function (POST|PUT|PATCH|DELETE)/);
  assert.match(source,/requireSchedulingApi\('appointment\.read'\)/);
});
