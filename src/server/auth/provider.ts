import 'server-only';
import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {twoFactor} from 'better-auth/plugins';
import {createAuthMiddleware,APIError} from 'better-auth/api';
import {randomUUID} from 'node:crypto';
import {getDb} from '@/server/db';
import {disabledSessionApiPaths,verifiedMfaSession} from './configuration.mjs';
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
    session:{expiresIn:60*60*8,updateAge:60*30,cookieCache:{enabled:false},additionalFields:{mfaVerifiedAt:{type:'date',required:false,input:false}}},
    advanced:{useSecureCookies:origin.startsWith('https:'),database:{generateId:'uuid'},defaultCookieAttributes:{httpOnly:true,sameSite:'lax'}},
    rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:5},'/two-factor/*':{window:60,max:5}}},
    plugins:[twoFactor({issuer:'Dr. Douglas Vaz',skipVerificationOnEnable:false,trustDeviceMaxAge:0})],
    hooks:{before:createAuthMiddleware(async context=>{
      if(context.path.startsWith('/two-factor/')&&context.body?.trustDevice===true){throw new APIError('BAD_REQUEST',{message:'A verificação em duas etapas é necessária neste acesso.'});}
    }),after:createAuthMiddleware(async context=>{
      const verified=verifiedMfaSession(context.path,context.context.returned,context.context.newSession);
      if(!verified)return;
      await db.$transaction(async transaction=>{
        const result=await transaction.session.updateMany({where:{token:verified.token,userId:verified.userId},data:{mfaVerifiedAt:new Date()}});
        if(result.count!==1)throw new APIError('INTERNAL_SERVER_ERROR',{message:'Não foi possível concluir a verificação de acesso.'});
        await transaction.$executeRaw`
          INSERT INTO "AuditEvent" ("id", "action", "outcome", "source", "actorUserId", "subjectUserId", "occurredAt")
          VALUES (${randomUUID()}::uuid, ${verified.action}, 'SUCCESS', 'WEB_SESSION', ${verified.userId}::uuid, ${verified.userId}::uuid, CURRENT_TIMESTAMP)
        `;
      });
    })},
    logger:{disabled:true},
  });
}
