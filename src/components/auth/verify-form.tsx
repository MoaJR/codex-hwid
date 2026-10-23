'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
export function VerifyForm({configured}:{configured:boolean}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!configured||busy)return;setBusy(true);setError('');const form=event.currentTarget;const code=String(new FormData(form).get('code')??'').trim();try{const response=await fetch('/api/auth/two-factor/verify-totp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,trustDevice:false})});if(!response.ok)throw new Error();form.reset();router.replace('/conta');router.refresh();}catch{setError('Não foi possível verificar o código. Tente novamente ou reinicie o acesso.');setBusy(false);}}
 return <form onSubmit={submit} aria-busy={busy}>{!configured&&<p className="notice">A verificação ainda não está configurada neste ambiente.</p>}<label htmlFor="verification-code">Código do aplicativo autenticador</label><input id="verification-code" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} minLength={6} required disabled={!configured||busy}/>{error&&<p role="alert" className="form-error">{error}</p>}<div className="form-actions"><button className="button" type="submit" disabled={!configured||busy}>{busy?'Verificando…':'Verificar acesso'}</button></div></form>;
}
