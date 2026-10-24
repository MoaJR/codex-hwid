import {articleReader} from '@/modules/content/repository';
import {normalizeQuery} from '@/modules/content/publication.mjs';
export async function GET(request:Request){
  const url=new URL(request.url);
  const query=normalizeQuery(url.searchParams.get('q'));
  const category=(url.searchParams.get('categoria')??'').slice(0,80);
  const [articles,categories]=await Promise.all([articleReader.list({query,category}),articleReader.categories()]);
  const items=articles.map(article=>({slug:article.slug,title:article.title,excerpt:article.excerpt,category:article.category,readingMinutes:article.readingMinutes,publishedAt:article.publishedAt}));
  return Response.json({items,total:items.length,categories},{headers:{'Cache-Control':'no-store'}});
}
