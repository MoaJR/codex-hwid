import 'server-only';
import {randomUUID} from 'node:crypto';
import {getDb} from '@/server/db';

export class CurrentSessionNotFoundError extends Error{
  constructor(){super('Sessão atual não encontrada.');this.name='CurrentSessionNotFoundError';}
}

export async function revokeOtherSessions(userId:string,currentSessionId:string){
  const db=getDb();
  return db.$transaction(async transaction=>{
    const now=new Date();
    const owner=await transaction.$queryRaw<{id:string}[]>`
      SELECT "id"::text AS "id" FROM "User" WHERE "id"=${userId}::uuid FOR UPDATE
    `;
    if(!owner[0])throw new CurrentSessionNotFoundError();
    const current=await transaction.session.findFirst({where:{id:currentSessionId,userId,expiresAt:{gt:now}},select:{id:true}});
    if(!current)throw new CurrentSessionNotFoundError();
    const deleted=await transaction.session.deleteMany({where:{userId,id:{not:currentSessionId},expiresAt:{gt:now}}});
    await transaction.$executeRaw`
      INSERT INTO "AuditEvent" ("id","action","outcome","source","actorUserId","subjectUserId","resourceType","resourceId","occurredAt")
      VALUES (${randomUUID()}::uuid,'OTHER_SESSIONS_REVOKED','SUCCESS','WEB_SESSION',${userId}::uuid,${userId}::uuid,'USER',${userId}::uuid,CURRENT_TIMESTAMP)
    `;
    return deleted.count;
  });
}
