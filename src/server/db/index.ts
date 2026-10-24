import 'server-only';
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let client=globalForPrisma.prisma;
export function getDb(){
  if(!client){client=new PrismaClient();if(process.env.NODE_ENV!=='production')globalForPrisma.prisma=client;}
  return client;
}
