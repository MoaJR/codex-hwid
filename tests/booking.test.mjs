import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getDemoDates,validateSelection} from '../src/components/booking/selection.mjs';
test('dates start after today in Sao Paulo, including around UTC midnight',()=>{const dates=getDemoDates(new Date('2026-10-24T01:00:00Z'));assert.equal(dates[0],'2026-10-26');assert.equal(dates.length,8);assert.equal(new Set(dates).size,8);for(const date of dates)assert(![0,6].includes(new Date(date+'T12:00:00Z').getUTCDay()));});
test('valid selection accepted; unknown type, forged date and time rejected',()=>{const dates=getDemoDates(new Date('2026-10-23T15:00:00Z'));const valid={type:'first',date:dates[0],time:'09:00'};assert.equal(validateSelection(valid,dates),null);for(const changed of [{type:'other'},{date:'2020-01-01'},{time:'03:00'}])assert.equal(typeof validateSelection({...valid,...changed},dates),'string');});
