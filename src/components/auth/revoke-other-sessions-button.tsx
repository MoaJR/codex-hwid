'use client';
import {useRef,useState} from 'react';

type Stage='idle'|'confirming'|'submitting';

export function RevokeOtherSessionsButton(){
  const requestInFlight=useRef(false);
  const [stage,setStage]=useState<Stage>('idle');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function revoke(){
    if(requestInFlight.current)return;
    requestInFlight.current=true;
    setStage('submitting');setMessage('');setError('');
    try{
      const response=await fetch('/api/account/sessions/revoke-others',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      const payload=await response.json().catch(()=>null) as {revokedCount?:unknown}|null;
      if(!response.ok||typeof payload?.revokedCount!=='number')throw new Error();
      setMessage(payload.revokedCount===0?'Nenhum outro acesso estava ativo.':payload.revokedCount===1?'Um outro acesso foi encerrado.':`${payload.revokedCount} outros acessos foram encerrados.`);
      setStage('idle');
    }catch{
      setError('Não foi possível encerrar os outros acessos. Tente novamente.');
      setStage('idle');
    }finally{requestInFlight.current=false;}
  }

  return <div className="session-control" aria-busy={stage==='submitting'}>
    {stage==='confirming'?<>
      <p>Confirme para encerrar todos os outros acessos. Esta sessão continuará conectada.</p>
      <div className="button-row"><button type="button" className="button" autoFocus onClick={revoke}>Confirmar encerramento</button><button type="button" className="button button-outline" onClick={()=>setStage('idle')}>Voltar</button></div>
    </>:<button type="button" className="button button-outline" disabled={stage==='submitting'} onClick={()=>{setMessage('');setError('');setStage('confirming')}}>{stage==='submitting'?'Encerrando…':'Encerrar outros acessos'}</button>}
    <div aria-live="polite">{message&&<p className="form-success">{message}</p>}{error&&<p role="alert" className="form-error">{error}</p>}</div>
  </div>;
}
