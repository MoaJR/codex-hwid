import 'server-only';
import {articles,type Article} from '@/content/articles';
import {publishedArticles,filterArticles} from './publication.mjs';
import {findPublishedInDatabase,listPublishedFromDatabase} from './store';
export interface ArticleReader {
  list(filters?: {query?:string;category?:string}): Promise<Article[]>;
  findBySlug(slug:string): Promise<Article|undefined>;
  categories():Promise<string[]>;
}
async function published():Promise<Article[]>{
  if(!process.env.DATABASE_URL?.trim())return publishedArticles(articles);
  return publishedArticles(await listPublishedFromDatabase());
}
export const articleReader:ArticleReader={
  async list(filters={}){return filterArticles(await published(),filters);},
  async findBySlug(slug){
    if(!process.env.DATABASE_URL?.trim())return publishedArticles(articles).find(article=>article.slug===slug);
    return findPublishedInDatabase(slug);
  },
  async categories(){return [...new Set((await published()).map(article=>article.category))].sort();},
};
