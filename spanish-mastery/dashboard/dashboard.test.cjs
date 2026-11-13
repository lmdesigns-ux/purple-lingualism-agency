const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {todayKey,reviewStatus,reviewGroups,dateLabel}=require('./logic.js');
function snapshot(){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),context);return context.window.SPANISH_MASTERY_DATA;}
test('review states before, on and after dates; completed and missing dates',()=>{
 const r={date:'2026-11-16'};
 assert.equal(reviewStatus(r,'2026-11-11'),'Upcoming');assert.equal(reviewStatus(r,'2026-11-16'),'Due today');assert.equal(reviewStatus(r,'2026-11-17'),'Due for review');
 for(const date of [undefined,'','2026-02-30','not-a-date']){assert.equal(reviewStatus({date},'2026-11-11'),'Date not set');assert.equal(dateLabel(date),'Date not set');}
 assert.equal(reviewStatus({...r,completed:true},'2026-12-10'),'Completed');
});
test('New York day boundary is independent of device timezone, including daylight saving',()=>{
 assert.equal(todayKey(new Date('2026-11-16T04:59:59Z')),'2026-11-15');
 assert.equal(todayKey(new Date('2026-11-16T05:00:00Z')),'2026-11-16');
 assert.equal(todayKey(new Date('2026-07-02T03:59:59Z')),'2026-07-01');
 assert.equal(todayKey(new Date('2026-07-02T04:00:00Z')),'2026-07-02');
 assert.equal(dateLabel('2026-11-16'),'November 16, 2026');
});
test('review groups choose the next upcoming date while retaining due and undated items',()=>{
 const r=[{date:'2026-12-09'},{date:'2026-11-16'},{title:'Undated'},{date:'2026-11-01',completed:true}];
 const before=JSON.stringify(r);const first=reviewGroups(r,'2026-11-11');
 assert.equal(first.due.length,0);assert.equal(first.upcoming[0].date,'2026-11-16');assert.equal(first.undated.length,1);
 const on=reviewGroups(r,'2026-11-16');assert.equal(on.due.length,1);assert.equal(on.upcoming[0].date,'2026-12-09');
 const after=reviewGroups(r,'2026-12-10');assert.equal(after.due.length,2);assert.equal(after.upcoming.length,0);assert.equal(JSON.stringify(r),before);
});
test('snapshot has five Polluelo core challenges, two retos, and only Tres mil earned',()=>{
 const data=snapshot();const polluelo=data.program.levels.find(x=>x.id==='polluelo');
 assert.equal(data.program.currentRank,'Huevo');assert.equal(polluelo.status,'In progress');assert.equal(polluelo.core.length,5);assert.equal(polluelo.retos.length,2);
 assert.deepEqual(Array.from(polluelo.core.filter(x=>x.status==='earned'),x=>x.title),['Tres mil']);assert.ok(polluelo.retos.every(x=>x.status==='unrecorded'));
 assert.equal(data.focusAreas.length,3);assert.equal(data.goals.length,3);assert.equal(data.achievements.length,3);
 for(const id of ['pajarito','cuervo']){const level=data.program.levels.find(x=>x.id===id);assert.equal(level.status,'Not available');assert.equal(level.core,undefined);}
});
test('snapshot source references and badge files exist; evidence IDs are real',()=>{
 const data=snapshot();const evidence=fs.readFileSync(path.join(__dirname,'../evidence.jsonl'),'utf8').trim().split('\n').map(JSON.parse);const ids=new Set(evidence.map(x=>x.id));
 function walk(value){if(!value||typeof value!=='object')return;
   if(Array.isArray(value.sources))for(const id of value.sources){assert.ok(data.sources[id],id);if(/^(S\d|EXT-|PLAN-)/.test(id))assert.ok(ids.has(id),id);}
   if(value.badge)assert.ok(fs.existsSync(path.resolve(__dirname,value.badge)),value.badge);
   for(const child of Object.values(value))walk(child);
 }
 walk(data);for(const source of Object.values(data.sources))assert.ok(fs.existsSync(path.resolve(__dirname,source.href)),source.href);
});
