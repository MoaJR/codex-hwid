import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Guarda do registro operacional de privacidade. O documento é a fonte das
// decisões que ainda dependem do responsável: estes testes impedem que ele
// desapareça, que uma decisão seja declarada aprovada sem registro e que
// credenciais, e-mails ou URLs de banco sejam escritos nele.
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const decisions=[['D1','controlador'],['D2','bases legais'],['D3','retenção'],['D4','subprocessadores'],['D5','backup'],['D6','incidentes']];

test('registro de privacidade existe e declara a aprovação de 10/11/2026',async()=>{
  const doc=await read('docs/PRIVACY.md');
  assert.match(doc,/Situação: D1–D6 aprovadas em 10\/11\/2026/);
  assert.match(doc,/## 2\. Dados tratados hoje/);
  assert.match(doc,/## 3\. Onde os dados ficam/);
  assert.match(doc,/## 4\. Controles já implementados/);
  assert.match(doc,/## 5\. Decisões registradas/);
  assert.match(doc,/## 6\. Critérios para liberar a Fase 5B/);
  assert.match(doc,/## 7\. Proibições vigentes/);
  assert.match(doc,/## 8\. Registro de aprovação/);
});

test('as seis decisões estão aprovadas com aprovador, data e evidência',async()=>{
  const doc=await read('docs/PRIVACY.md');
  for(const [id,topic] of decisions){
    assert.match(doc,new RegExp(`### ${id} — [^\\n]*${topic}`,'i'),`${id} deveria tratar de ${topic}`);
    assert.match(doc,new RegExp(`\\| ${id} \\|[^\\n]*\\| aprovada em 10/11/2026`),`${id} deveria estar aprovada em 10/11/2026`);
    assert.match(doc,new RegExp(`\\| ${id} \\|[^\\n]*\\| Responsável \\| 10/11/2026 \\| [^|\\n]+ \\|`),`${id} precisa de aprovador, data e evidência`);
  }
  const approvedRows=doc.match(/\| Responsável \| 10\/11\/2026 \|/g)??[];
  assert.equal(approvedRows.length,decisions.length,'cada decisão precisa de uma linha de aprovação preenchida');
  assert.doesNotMatch(doc,/\| pendente \| pendente \| pendente \|/,'nenhuma aprovação pode voltar a ficar pendente sem decisão nova');
});

test('registro não expõe credencial, e-mail ou URL de banco',async()=>{
  const doc=await read('docs/PRIVACY.md');
  assert.doesNotMatch(doc,/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,'o documento não deve conter e-mails');
  assert.doesNotMatch(doc,/postgres(?:ql)?:\/\//i,'o documento não deve conter URL de banco');
  assert.doesNotMatch(doc,/\beyJ[A-Za-z0-9_-]{10,}/,'o documento não deve conter token');
  assert.doesNotMatch(doc,/(?:senha|password)\s*[:=]\s*\S+/i,'o documento não deve registrar senha');
});

test('registro é referenciado na leitura obrigatória e no README',async()=>{
  const [handoff,readme]=await Promise.all([read('CLINE_START.md'),read('README.md')]);
  assert.match(handoff,/docs\/PRIVACY\.md/);
  assert.match(readme,/docs\/PRIVACY\.md/);
});

test('o canal do titular não pode ser dado como publicado sem endereço oficial',async()=>{
  const doc=await read('docs/PRIVACY.md');
  assert.match(doc,/canal do titular (?:pendente|ainda não informado)/i,'o registro precisa marcar o canal como aberto');
  const page=await read('src/app/privacidade/page.tsx');
  assert.doesNotMatch(page,/duas etapas|segundo fator|autenticador|two-factor/i,'a página cita controle que não existe mais');
  assert.match(page,/canal oficial, que está em confirmação/i,'a página precisa declarar o canal em confirmação');
  assert.match(page,/Limites atuais/);
  assert.match(page,/não usa rastreadores/i);
  assert.match(page,/5 anos/,'a retenção aprovada precisa estar publicada');
  assert.match(page,/transferência internacional/i,'a transferência aprovada precisa estar publicada');
});
