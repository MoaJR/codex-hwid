import test from 'node:test';
import assert from 'node:assert/strict';
import {schedulingServiceSeed,seedScheduling} from '../scripts/seed-scheduling.mjs';

test('catálogo inicial separa tipo e modalidade sem preços ou disponibilidade inventada',()=>{
  assert.equal(schedulingServiceSeed.length,4);
  assert.deepEqual(new Set(schedulingServiceSeed.map(item=>item.mode)),new Set(['IN_PERSON','ONLINE']));
  assert(schedulingServiceSeed.every(item=>item.durationMinutes>=15&&item.bufferAfterMinutes>=0));
  assert(schedulingServiceSeed.every(item=>!('price' in item)&&!('weekday' in item)));
});

test('seed da agenda é aditivo e seguro quando há exatamente um médico',async()=>{
  let writes=0;
  const client={$queryRaw:async()=>[{id:'11111111-1111-4111-8111-111111111111',name:'Dr. Douglas Vaz'}],$executeRaw:async()=>{writes+=1;return writes<=2?1:0;}};
  assert.deepEqual(await seedScheduling(client),{operation:'SCHEDULING_SERVICE_SEED',status:'ready',inserted:2,skipped:2});
  assert.equal(writes,4);
});

test('seed não escolhe médico de forma ambígua',async()=>{
  for(const doctors of [[],[{id:'a',name:'Outro médico'},{id:'b',name:'Outra médica'}]]){
    let writes=0;const client={$queryRaw:async()=>doctors,$executeRaw:async()=>{writes+=1;return 1;}};
    await assert.rejects(()=>seedScheduling(client),/único médico/);assert.equal(writes,0);
  }
});
