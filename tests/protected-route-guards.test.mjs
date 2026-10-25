import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {modulesForRoles} from '../src/modules/account/panel-access.mjs';

// Contrato dos guardas server-side: o E2E autenticado não substitui esta rede de
// segurança. Se um guarda for removido, trocado ou receber outra permissão, o
// teste falha antes de qualquer publicação.
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

const protectedPages=[
  {file:'src/app/painel/page.tsx',guard:'await requirePanelPage();'},
  {file:'src/app/paciente/page.tsx',guard:'await requirePatientPage();'},
  {file:'src/app/admin/page.tsx',guard:"await requirePermissionPage('settings.manage');"},
  {file:'src/app/medico/agenda/page.tsx',guard:"await requireSchedulingPage('appointment.read');"},
  {file:'src/app/medico/conteudos/page.tsx',guard:"await requireEditorialPage('content.read');"},
  {file:'src/app/medico/conteudos/novo/page.tsx',guard:"await requireEditorialPage('content.write');"},
  {file:'src/app/medico/conteudos/[id]/page.tsx',guard:"await requireEditorialPage('content.read');"},
];

const protectedApis=[
  {file:'src/app/api/account/password/route.ts',guards:['await requireAccountPasswordApi();']},
  {file:'src/app/api/account/sessions/revoke-others/route.ts',guards:['await requireAccountSessionApi();']},
  {file:'src/app/api/admin/articles/route.ts',guards:["await requireEditorialApi('content.read')","await requireEditorialApi('content.write')"]},
  {file:'src/app/api/admin/articles/[id]/route.ts',guards:["await requireEditorialApi('content.read')","await requireEditorialApi('content.write')"]},
  {file:'src/app/api/admin/articles/[id]/transition/route.ts',guards:['await requireEditorialApi(permission)']},
  {file:'src/app/api/medico/agenda/route.ts',guards:["await requireSchedulingApi('appointment.read')"]},
  {file:'src/app/api/medico/appointments/route.ts',guards:["await requireSchedulingApi('appointment.write')"]},
  {file:'src/app/api/medico/appointments/[id]/route.ts',guards:["await requireSchedulingApi('appointment.write')"]},
  {file:'src/app/api/medico/appointments/[id]/cancel/route.ts',guards:["await requireSchedulingApi('appointment.write')"]},
  {file:'src/app/api/medico/availability/route.ts',guards:["await requireSchedulingApi('availability.write')"]},
  {file:'src/app/api/medico/availability/[id]/route.ts',guards:["await requireSchedulingApi('availability.write')"]},
];

const mutatingApis=[
  {file:'src/app/api/account/password/route.ts',checks:/readPasswordChangeRequest/},
  {file:'src/app/api/account/sessions/revoke-others/route.ts',checks:/readSessionControlRequest/},
  {file:'src/app/api/admin/articles/route.ts',checks:/isTrustedMutationOrigin/},
  {file:'src/app/api/admin/articles/[id]/route.ts',checks:/isTrustedMutationOrigin/},
  {file:'src/app/api/admin/articles/[id]/transition/route.ts',checks:/isTrustedMutationOrigin/},
  {file:'src/app/api/medico/appointments/route.ts',checks:/validateSchedulingOrigin/},
  {file:'src/app/api/medico/appointments/[id]/route.ts',checks:/validateSchedulingOrigin/},
  {file:'src/app/api/medico/appointments/[id]/cancel/route.ts',checks:/validateSchedulingOrigin/},
  {file:'src/app/api/medico/availability/route.ts',checks:/validateSchedulingOrigin/},
  {file:'src/app/api/medico/availability/[id]/route.ts',checks:/validateSchedulingOrigin/},
];

test('toda página protegida chama o guarda de servidor antes de consultar dados',async()=>{
  for(const page of protectedPages){
    const source=await read(page.file);
    assert.ok(source.includes(page.guard),`${page.file} deveria chamar ${page.guard}`);
    assert.match(source,/from '@\/server\/auth\/(?:panel-access|scheduling-access|editorial-page)'/,`${page.file} deveria importar o guarda de servidor`);
    assert.match(source,/export const dynamic='force-dynamic'/,`${page.file} deveria renderizar por requisição`);
    assert.doesNotMatch(source,/'use client'/,`${page.file} não pode ser componente de cliente`);
    assert.doesNotMatch(source,/from '@\/server\/db'/,`${page.file} deve consultar dados apenas por módulos autorizados`);
  }
});

test('toda API protegida aplica o guarda correto e valida a origem das mutações',async()=>{
  for(const route of protectedApis){
    const source=await read(route.file);
    for(const guard of route.guards)assert.ok(source.includes(guard),`${route.file} deveria chamar ${guard}`);
  }
  for(const route of mutatingApis){
    const source=await read(route.file);
    assert.match(source,route.checks,`${route.file} deveria validar a origem antes do corpo`);
    assert.match(source,/access\.response/,`${route.file} deveria devolver a resposta de negação do guarda`);
  }
});


test('área do paciente usa somente o userId da sessão, é somente leitura e projeta metadados mínimos',async()=>{
  const [page,dashboard]=await Promise.all([
    read('src/app/paciente/page.tsx'),
    read('src/modules/account/patient-dashboard.ts'),
  ]);
  assert.match(page,/getPatientDashboard\(context\.actor\.userId\)/);
  assert.doesNotMatch(page,/searchParams|next\/headers|patientId/);
  assert.match(dashboard,/FROM "Patient" WHERE "userId"=\$\{userId\}::uuid/);
  assert.ok(dashboard.includes('patient."userId"=${userId}::uuid'));
  assert.match(dashboard,/LIMIT 10/);
  assert.match(dashboard,/LIMIT 20/);
  assert.match(dashboard,/status"='CONFIRMED'/);
  assert.doesNotMatch(dashboard,/SELECT \*/i);
  assert.doesNotMatch(dashboard,/patient\."(?:name|email|phone|cpf|document)"/i);
  assert.doesNotMatch(dashboard,/clinicalNotes|diagnosis|prescription/i);
  assert.doesNotMatch(dashboard,/\b(?:INSERT|UPDATE|DELETE)\b/);
  assert.doesNotMatch(dashboard,/\.(?:create|createMany|update|updateMany|delete|deleteMany|upsert)\(/);
});

test('administração não consulta agenda, paciente ou prontuário',async()=>{
  const source=await read('src/app/admin/page.tsx');
  assert.match(source,/await requirePermissionPage\('settings\.manage'\);/);
  assert.match(source,/listEditorialArticles\(\)/);
  assert.doesNotMatch(source,/getPatientDashboard|listSchedulingWorkspace|createAppointment|medical_record|patientId/);
  assert.doesNotMatch(source,/from '@\/server\/db'/);
});

test('cada card do painel aponta para uma página implementada e protegida',async()=>{
  const modules=modulesForRoles(['PATIENT','DOCTOR','SECRETARY','ADMIN']);
  assert.deepEqual(modules.map(module=>module.id),['patient','schedule','content','admin','account']);
  for(const module of modules){
    assert.match(module.href,/^\/[a-z]+(?:\/[a-z]+)?$/,`href inválido em ${module.id}`);
    assert.ok(module.title.length>0&&module.description.length>0,`card ${module.id} sem texto real`);
    const pagePath=`src/app${module.href}/page.tsx`;
    await access(new URL(pagePath,root));
    const page=await read(pagePath);
    assert.match(page,/require[A-Za-z]+Page\(|getSessionContext\(/,`${pagePath} deveria resolver a sessão no servidor`);
  }
});

test('o painel deriva os cards dos papéis da sessão, sem lista paralela no cliente',async()=>{
  const source=await read('src/app/painel/page.tsx');
  assert.match(source,/modulesForRoles\(context\.actor\.roles\)/);
  assert.match(source,/labelsForRoles\(context\.actor\.roles\)/);
  assert.match(source,/href=\{module\.href\}/);
  assert.doesNotMatch(source,/'use client'/);
});

