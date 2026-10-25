import 'server-only';
import {randomUUID} from 'node:crypto';
import {hashPassword,verifyPassword} from 'better-auth/crypto';
import {getDb} from '@/server/db';
import {CurrentSessionNotFoundError} from './session-store';

export class InvalidCurrentPasswordError extends Error{
  constructor(){super('Senha atual inválida.');this.name='InvalidCurrentPasswordError';}
}

export class CredentialPasswordUnavailableError extends Error{
  constructor(){super('Conta de senha indisponível.');this.name='CredentialPasswordUnavailableError';}
}

export class PasswordChangeConflictError extends Error{
  constructor(){super('A senha foi alterada por outra solicitação.');this.name='PasswordChangeConflictError';}
}

export async function changeCredentialPassword(userId:string,currentSessionId:string,currentPassword:string,newPassword:string){
  const db=getDb();
  return db.$transaction(async transaction=>{
    const now=new Date();
    const owner=await transaction.$queryRaw<{id:string}[]>`
      SELECT "id"::text AS "id" FROM "User" WHERE "id"=${userId}::uuid FOR UPDATE
    `;
    if(!owner[0])throw new CurrentSessionNotFoundError();

    const current=await transaction.session.findFirst({
      where:{id:currentSessionId,userId,expiresAt:{gt:now}},
      select:{id:true},
    });
    if(!current)throw new CurrentSessionNotFoundError();

    const accounts=await transaction.account.findMany({
      where:{userId,providerId:'credential'},
      select:{id:true,password:true},
      orderBy:{createdAt:'asc'},
      take:2,
    });
    const account=accounts[0];
    if(accounts.length!==1||!account?.password){
      await hashPassword(currentPassword);
      throw new InvalidCurrentPasswordError();
    }

    let valid=false;
    try{valid=await verifyPassword({hash:account.password,password:currentPassword});}
    catch{throw new CredentialPasswordUnavailableError();}
    if(!valid)throw new InvalidCurrentPasswordError();

    const replacement=await hashPassword(newPassword);
    const updated=await transaction.account.updateMany({
      where:{id:account.id,password:account.password},
      data:{password:replacement},
    });
    if(updated.count!==1)throw new PasswordChangeConflictError();

    const revoked=await transaction.session.deleteMany({
      where:{userId,id:{not:currentSessionId},expiresAt:{gt:now}},
    });
    await transaction.$executeRaw`
      INSERT INTO "AuditEvent" ("id","action","outcome","source","actorUserId","subjectUserId","resourceType","resourceId","occurredAt")
      VALUES (${randomUUID()}::uuid,'PASSWORD_CHANGED','SUCCESS','WEB_SESSION',${userId}::uuid,${userId}::uuid,'USER',${userId}::uuid,CURRENT_TIMESTAMP)
    `;
    return revoked.count;
  },{maxWait:5000,timeout:10000});
}
