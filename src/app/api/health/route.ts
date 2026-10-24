export function GET(){
  const stage=process.env.VERCEL_ENV??process.env.NODE_ENV??'unknown';
  return Response.json({status:'ok',service:'douglas-vaz',stage},{headers:{'Cache-Control':'no-store'}});
}
