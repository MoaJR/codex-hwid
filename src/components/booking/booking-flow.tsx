'use client';
import {useState} from 'react';
import Link from 'next/link';
import {appointmentTypes,demoTimes,formatDemoDate,validateSelection} from './selection.mjs';
export function BookingFlow({dates}:{dates:string[]}){
  const [step,setStep]=useState(0);
  const [selection,setSelection]=useState({type:'',date:'',time:''});
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  const selectedType=appointmentTypes.find(t=>t.id===selection.type);
  function next(){
    if(step===0&&!selectedType){setError('Escolha o tipo de atendimento.');return;}
    if(step>0){const invalid=validateSelection(selection,dates);if(invalid){setError(invalid);return;}}
    setError('');if(step===2)setDone(true);else setStep(step+1);
  }
  if(done)return <div className="panel booking-result" role="status"><span className="eyebrow">Simulação concluída</span><h2>Você conheceu o caminho.</h2><p>{selectedType?.label}<br/>{formatDemoDate(selection.date)} · {selection.time}</p><p>Nenhuma consulta foi reservada. Para o atendimento real, disponibilidade, valores e identificação ainda precisam ser integrados com a equipe.</p><button className="button" onClick={()=>{setDone(false);setStep(0);setSelection({type:'',date:'',time:''});}}>Explorar novamente</button><Link className="text-link" href="/">Voltar ao início</Link></div>;
  return <div className="panel booking-panel"><ol className="booking-steps" aria-label="Etapas do agendamento">{['Atendimento','Data e horário','Revisão'].map((label,index)=><li key={label} aria-current={step===index?'step':undefined}><span>{index+1}</span>{label}</li>)}</ol><form onSubmit={e=>{e.preventDefault();next();}}>
    {step===0&&<fieldset><legend>Qual atendimento você deseja conhecer?</legend><div className="booking-options">{appointmentTypes.map(type=><label key={type.id} className={`booking-option ${selection.type===type.id?'is-selected':''}`}><input type="radio" name="type" value={type.id} checked={selection.type===type.id} onChange={()=>{setSelection({...selection,type:type.id});setError('');}}/><span><strong>{type.label}</strong><small>{type.description}</small></span></label>)}</div></fieldset>}
    {step===1&&<><fieldset><legend>Escolha uma data ilustrativa</legend><p className="notice">Datas e horários abaixo são exemplos para testar a interface.</p><div className="date-options">{dates.map(date=><label key={date} className={`date-option ${selection.date===date?'is-selected':''}`}><input type="radio" name="date" value={date} checked={selection.date===date} onChange={()=>{setSelection({...selection,date,time:''});setError('');}}/><span>{formatDemoDate(date)}</span></label>)}</div></fieldset><fieldset><legend>Horário ilustrativo</legend><div className="time-options">{demoTimes.map(time=><label key={time} className={`date-option ${selection.time===time?'is-selected':''}`}><input type="radio" name="time" value={time} checked={selection.time===time} onChange={()=>{setSelection({...selection,time});setError('');}}/><span>{time}</span></label>)}</div><p className="notice">Horário de Brasília · America/Sao_Paulo</p></fieldset></>}
    {step===2&&<div><h2>Confira sua escolha</h2><dl className="booking-review"><div><dt>Atendimento</dt><dd>{selectedType?.label}</dd></div><div><dt>Data ilustrativa</dt><dd>{formatDemoDate(selection.date)}</dd></div><div><dt>Horário de Brasília</dt><dd>{selection.time}</dd></div></dl><p>Não pedimos dados pessoais nem pagamento nesta demonstração. Ao concluir, você apenas encerra a simulação.</p></div>}
    <p className="form-error" role="alert">{error}</p><div className="booking-actions">{step>0&&<button className="button button-secondary" type="button" onClick={()=>{setStep(step-1);setError('');}}>← Voltar</button>}<button type="submit" className="button">{step===2?'Concluir simulação':'Continuar →'}</button></div>
  </form></div>;
}
