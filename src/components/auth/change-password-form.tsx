'use client';
import {type FormEvent,useRef,useState} from 'react';

type PasswordResponse={
  changed?:unknown;
  revokedCount?:unknown;
  error?:{message?:unknown};
};

export function ChangePasswordForm(){
  const requestInFlight=useRef(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(requestInFlight.current)return;
    const form=event.currentTarget;
    const fields=new FormData(form);
    const currentPassword=String(fields.get('currentPassword')??'');
    const newPassword=String(fields.get('newPassword')??'');
    const confirmPassword=String(fields.get('confirmPassword')??'');
    setMessage('');setError('');
    if(newPassword!==confirmPassword){setError('A confirmação da nova senha não coincide.');return;}
    if(currentPassword===newPassword){setError('Escolha uma senha diferente da atual.');return;}

    requestInFlight.current=true;setBusy(true);
    try{
      const response=await fetch('/api/account/password',{
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({currentPassword,newPassword,confirmPassword}),
      });
      const payload=await response.json().catch(()=>null) as PasswordResponse|null;
      if(!response.ok||payload?.changed!==true||typeof payload.revokedCount!=='number'){
        const serverMessage=payload?.error&&typeof payload.error.message==='string'?payload.error.message:null;
        throw new Error(serverMessage??'Não foi possível alterar a senha. Tente novamente.');
      }
      form.reset();
      setMessage(payload.revokedCount===0
        ?'Senha alterada. Esta sessão continua conectada.'
        :payload.revokedCount===1
          ?'Senha alterada e um outro acesso foi encerrado.'
          :`Senha alterada e ${payload.revokedCount} outros acessos foram encerrados.`);
    }catch(reason){
      setError(reason instanceof Error?reason.message:'Não foi possível alterar a senha. Tente novamente.');
    }finally{requestInFlight.current=false;setBusy(false);}
  }

  return <form className="password-change-form" onSubmit={submit} aria-busy={busy}>
    <label htmlFor="account-current-password">Senha atual</label>
    <input id="account-current-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required disabled={busy}/>
    <div className="form-grid">
      <div><label htmlFor="account-new-password">Nova senha</label><input id="account-new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} aria-describedby="account-password-hint" required disabled={busy}/></div>
      <div><label htmlFor="account-confirm-password">Confirme a nova senha</label><input id="account-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy}/></div>
    </div>
    <p id="account-password-hint" className="field-hint">Use de 12 a 128 caracteres. A nova senha precisa ser diferente da atual.</p>
    <button type="submit" className="button" disabled={busy}>{busy?'Alterando…':'Alterar senha e encerrar outros acessos'}</button>
    <div className="password-change-feedback" aria-live="polite">
      {message&&<p className="form-success">{message}</p>}
      {error&&<p className="form-error" role="alert">{error}</p>}
    </div>
  </form>;
}
