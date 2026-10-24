export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  editorialLabel: string;
  reviewNotice: string;
  blocks: ArticleBlock[];
};

import {sourceArticles} from './articles-data.mjs';

export const articles = sourceArticles as Article[];
