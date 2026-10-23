/** @typedef {{slug:string,title:string,excerpt:string,category:string,status:string,publishedAt?:string}} PublicCandidate */
/** @param {string} value */
function normalize(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');}
/** Publication visibility is shared by the public API and server-rendered pages.
 * @template {PublicCandidate} T
 * @param {readonly T[]} articles
 * @param {Date} now
 * @returns {T[]}
 */
export function publishedArticles(articles,now = new Date()){
  return articles.filter(article=>{
    if(article.status!=='PUBLISHED'||!article.publishedAt)return false;
    const date=Date.parse(article.publishedAt);
    return Number.isFinite(date)&&date<=now.getTime();
  }).sort((a,b)=>Date.parse(b.publishedAt??'')-Date.parse(a.publishedAt??'')||a.slug.localeCompare(b.slug));
}
/** @param {unknown} query */
export function normalizeQuery(query){return typeof query==='string'?query.trim().slice(0,120):'';}
/** @template {PublicCandidate} T @param {readonly T[]} published @param {{query?:string,category?:string}} filters @returns {T[]} */
export function filterArticles(published,{query='',category=''}={}){
  const q=normalize(normalizeQuery(query));
  return published.filter(article=>(!category||article.category===category)&&(!q||normalize([article.title,article.excerpt,article.category].join(' ')).includes(q)));
}
