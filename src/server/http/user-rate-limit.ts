import 'server-only';
import {getDb} from '@/server/db';

export class UserRateLimitError extends Error{
  retryAfter:number;
  constructor(retryAfter:number){super('Limite de requisições atingido.');this.name='UserRateLimitError';this.retryAfter=retryAfter;}
}

export async function enforceUserRateLimit(userId:string,scope:string,limit:number,windowSeconds=60){
  const now=Date.now();
  const bucket=Math.floor(now/(windowSeconds*1000));
  const expiresAt=new Date((bucket+1)*windowSeconds*1000);
  const key=`${scope}:${userId}:${bucket}`;
  const db=getDb();
  await db.$executeRaw`
    DELETE FROM "ApiRateLimit" WHERE "key" IN (
      SELECT "key" FROM "ApiRateLimit" WHERE "expiresAt"<CURRENT_TIMESTAMP ORDER BY "expiresAt" LIMIT 100
    )
  `;
  const rows=await db.$queryRaw<{count:number}[]>`
    INSERT INTO "ApiRateLimit" ("key","count","expiresAt","updatedAt")
    VALUES (${key},1,${expiresAt},CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE
      SET "count"="ApiRateLimit"."count"+1,"updatedAt"=CURRENT_TIMESTAMP
    RETURNING "count"
  `;
  if((rows[0]?.count??limit+1)>limit)throw new UserRateLimitError(Math.max(1,Math.ceil((expiresAt.getTime()-now)/1000)));
}
