'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Icon} from '@/components/dashboard/icons';
export function SignOutButton(){
  const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function signOut(){setBusy(true);setError('');try{const response=await fetch('/api/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw new Error();router.replace('/login');router.refresh();}catch{setError('Não foi possível sair. Tente novamente.');setBusy(false);}}
  return <div><button className="button button-outline" disabled={busy} onClick={signOut}><Icon name="logout"/><span>{busy?'Saindo…':'Sair da conta'}</span></button>{error&&<p role="alert" className="form-error">{error}</p>}</div>;
}
