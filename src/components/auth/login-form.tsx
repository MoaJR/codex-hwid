'use client';

import {useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';

const accessError = 'Não foi possível entrar. Confira os dados e tente novamente. Se o problema continuar, procure a equipe responsável pelo seu acesso.';

export function LoginForm({configured}:{configured:boolean}){
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!configured || loading) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get('email') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    setError('');
    setLoading(true);
    try{
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email, password, rememberMe:false}),
      });
      const data:unknown = await response.json();
      if(!response.ok || !data || typeof data !== 'object'){
        setError(accessError);
        return;
      }
      form.reset();
      if('twoFactorRedirect' in data && data.twoFactorRedirect === true){
        router.push('/verificar-acesso');
      }else{
        router.push('/conta');
      }
      router.refresh();
    }catch{
      setError(accessError);
    }finally{
      setLoading(false);
    }
  }

  return <form onSubmit={submit} aria-busy={loading} aria-describedby="login-guidance">
    {!configured && <p className="notice" role="status">O acesso autenticado ainda não está configurado neste ambiente. A equipe precisa concluir a configuração antes de habilitar a entrada.</p>}
    <p id="login-guidance">Use as credenciais disponibilizadas para o seu acesso. Não é necessário informar dados de saúde neste formulário.</p>
    <label htmlFor="login-email">E-mail</label>
    <input id="login-email" name="email" type="email" autoComplete="username" inputMode="email" required maxLength={254} disabled={!configured || loading} autoCapitalize="none" spellCheck={false}/>
    <label htmlFor="login-password">Senha</label>
    <input id="login-password" name="password" type="password" autoComplete="current-password" required disabled={!configured || loading} aria-describedby={error ? 'login-error' : undefined}/>
    {error && <p className="form-error" id="login-error" role="alert" style={{marginTop:16}}>{error}</p>}
    <div className="form-actions"><button className="button" type="submit" disabled={!configured || loading}>{loading ? 'Entrando…' : 'Entrar com segurança'}</button></div>
    <p className="field-hint" role="status" aria-live="polite">{loading ? 'Verificando o acesso. Aguarde.' : 'Não há criação de conta ou recuperação de senha por este formulário.'}</p>
  </form>;
}
