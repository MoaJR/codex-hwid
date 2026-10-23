import 'server-only';
import {articles,type Article} from '@/content/articles';
import {publishedArticles,filterArticles} from './publication.mjs';
/** This provider is read-only and versioned with the source. No CMS writes yet. */
export interface ArticleReader {
  list(filters?: {query?:string;category?:string}): Article[];
  findBySlug(slug:string): Article|undefined;
  categories():string[];
}
export const articleReader:ArticleReader={
  list(filters={}){return filterArticles(publishedArticles(articles),filters);},
  findBySlug(slug){return publishedArticles(articles).find(article=>article.slug===slug);},
  categories(){return [...new Set(publishedArticles(articles).map(article=>article.category))].sort();},
};
