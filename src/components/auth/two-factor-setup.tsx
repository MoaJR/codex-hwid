'use client';

import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {QRCodeSVG} from 'qrcode.react';

type Setup={totpURI:string;secret:string;backupCodes:string[]};
const setupError='Não foi possível iniciar a verificação. Confira a senha e tente novamente.';
const verificationError='O código não foi confirmado. Confira o horário do dispositivo e tente novamente.';

function readSetup(value:unknown):Setup|null{
  if(!value||typeof value!=='object')return null;
  const data=value as {method?:unknown;totpURI?:unknown;backupCodes?:unknown};
  if(data.method!=='totp'||typeof data.totpURI!=='string'||!Array.isArray(data.backupCodes)||!data.backupCodes.every(code=>typeof code==='string'))return null;
  try{
    const uri=new URL(data.totpURI);
    const secret=uri.searchParams.get('secret');
    if(uri.protocol!=='otpauth:'||!secret||!/^[A-Z2-7]+$/i.test(secret))return null;
    return {totpURI:data.totpURI,secret,backupCodes:data.backupCodes};
  }catch{return null;}
}

export function TwoFactorSetup(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [setup,setSetup]=useState<Setup|null>(null);
  const [verified,setVerified]=useState(false);
  const [saved,setSaved]=useState(false);
  const [copyStatus,setCopyStatus]=useState('');

  async function enable(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setError('');
    const form=event.currentTarget;
    const password=String(new FormData(form).get('password')??'');
    try{
      const response=await fetch('/api/auth/two-factor/enable',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password,method:'totp'})});
      const data:unknown=await response.json();
      const parsed=readSetup(data);
      if(!response.ok||!parsed)throw new Error();
      form.reset();setSetup(parsed);
    }catch{setError(setupError);}finally{setBusy(false);}
  }

  async function verify(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!setup||busy)return;setBusy(true);setError('');
    const form=event.currentTarget;
    const code=String(new FormData(form).get('code')??'').trim();
    try{
      const response=await fetch('/api/auth/two-factor/verify-totp',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,trustDevice:false})});
      if(!response.ok)throw new Error();
      form.reset();setVerified(true);
    }catch{setError(verificationError);}finally{setBusy(false);}
  }

  async function copy(value:string,message:string){
    try{await navigator.clipboard.writeText(value);setCopyStatus(message);}catch{setCopyStatus('Não foi possível copiar automaticamente. Selecione e copie o texto.');}
  }

  if(!setup)return <section className="mfa-setup" aria-labelledby="mfa-setup-title"><h3 id="mfa-setup-title">Proteja sua conta</h3><p>Para acessar recursos da equipe, ative a verificação em duas etapas. Sua senha é confirmada pelo provedor de autenticação e não é armazenada por esta página.</p><form onSubmit={enable} aria-busy={busy}><label htmlFor="mfa-current-password">Confirme sua senha</label><input id="mfa-current-password" name="password" type="password" autoComplete="current-password" minLength={12} maxLength={128} required disabled={busy}/>{error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button" type="submit" disabled={busy}>{busy?'Preparando…':'Ativar aplicativo autenticador'}</button></div></form></section>;

  if(!verified)return <section className="mfa-setup" aria-labelledby="mfa-register-title"><h3 id="mfa-register-title">Cadastre no aplicativo autenticador</h3><p>Leia o QR code com seu aplicativo. Se estiver usando este site no celular, cadastre a chave manualmente.</p><div className="mfa-enrollment"><div className="mfa-qr"><QRCodeSVG value={setup.totpURI} size={190} level="M" marginSize={4} title="QR code para cadastrar o aplicativo autenticador"/></div><div><p className="field-hint">Chave de configuração</p><code className="mfa-secret">{setup.secret}</code><button className="button button-outline" type="button" onClick={()=>copy(setup.secret,'Chave copiada.')} disabled={busy}>Copiar chave</button></div></div><form onSubmit={verify} aria-busy={busy}><label htmlFor="mfa-first-code">Digite o código de 6 dígitos</label><input id="mfa-first-code" name="code" type="text" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy}/>{copyStatus&&<p className="field-hint" role="status">{copyStatus}</p>}{error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button" type="submit" disabled={busy}>{busy?'Verificando…':'Confirmar código'}</button></div></form></section>;

  return <section className="mfa-setup" aria-labelledby="mfa-backup-title"><h3 id="mfa-backup-title">Guarde os códigos de recuperação</h3><p>Cada código funciona uma vez. Guarde-os fora deste dispositivo e nunca envie por mensagem.</p><ul className="mfa-backup-codes" aria-label="Códigos de recuperação">{setup.backupCodes.map(code=><li key={code}><code>{code}</code></li>)}</ul><button className="button button-outline" type="button" onClick={()=>copy(setup.backupCodes.join('\n'),'Códigos copiados.')} disabled={busy}>Copiar códigos</button>{copyStatus&&<p className="field-hint" role="status">{copyStatus}</p>}<label className="mfa-confirm"><input type="checkbox" checked={saved} onChange={event=>setSaved(event.target.checked)}/> Confirmo que guardei os códigos em local seguro.</label><div className="form-actions"><button className="button" type="button" disabled={!saved} onClick={()=>router.refresh()}>Concluir ativação</button></div></section>;
}
