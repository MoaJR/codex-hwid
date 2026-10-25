import 'server-only';
import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {getDb} from '@/server/db';
import {disabledSessionApiPaths} from './configuration.mjs';
export function createAuth(){
  const db=getDb();
  const origin=new URL(process.env.BETTER_AUTH_URL!).origin;
  return betterAuth({
    appName:'Dr. Douglas Vaz',
    baseURL:origin,
    secret:process.env.BETTER_AUTH_SECRET!,
    trustedOrigins:[origin],
    disabledPaths:[...disabledSessionApiPaths],
    database:prismaAdapter(db,{provider:'postgresql'}),
    emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:12,maxPasswordLength:128,requireEmailVerification:false},
    account:{accountLinking:{enabled:false}},
    session:{expiresIn:60*60*8,updateAge:60*30,cookieCache:{enabled:false}},
    advanced:{useSecureCookies:origin.startsWith('https:'),database:{generateId:'uuid'},defaultCookieAttributes:{httpOnly:true,sameSite:'lax'}},
    rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:5}}},
    logger:{disabled:true},
  });
}

