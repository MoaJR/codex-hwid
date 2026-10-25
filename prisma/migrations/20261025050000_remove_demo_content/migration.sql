-- Replace the retired demonstration labels only when content still matches the original seeded text.
WITH "targets" AS (
  SELECT DISTINCT article."id"
  FROM "Article" article
  LEFT JOIN "ArticleBlock" block ON block."articleId" = article."id"
  WHERE article."editorialLabel" = 'Conteúdo de demonstração'
     OR article."reviewNotice" = 'Texto educativo de demonstração, ainda sujeito a revisão clínica. Não substitui uma avaliação individual.'
     OR block."text" IN (
       'Use os canais confirmados pela equipe e evite compartilhar links de atendimento com outras pessoas. Antes de enviar documentos, confira o destinatário e peça orientação sobre o canal apropriado. Esta demonstração ainda não oferece atendimento por vídeo nem envio de documentos reais.',
       'Mensagens administrativas e esta plataforma de demonstração não oferecem atendimento de emergência. Em uma situação de risco imediato, procure um serviço de urgência.'
     )
),
"article_updates" AS (
  UPDATE "Article" article
  SET "editorialLabel" = CASE
        WHEN article."editorialLabel" = 'Conteúdo de demonstração' THEN 'Conteúdo educativo'
        ELSE article."editorialLabel"
      END,
      "reviewNotice" = CASE
        WHEN article."reviewNotice" = 'Texto educativo de demonstração, ainda sujeito a revisão clínica. Não substitui uma avaliação individual.'
          THEN 'Informação educativa. Não substitui uma avaliação individual.'
        ELSE article."reviewNotice"
      END,
      "version" = article."version" + 1,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE article."id" IN (SELECT "id" FROM "targets")
  RETURNING article."id"
),
"block_updates" AS (
  UPDATE "ArticleBlock" block
  SET "text" = CASE block."text"
    WHEN 'Use os canais confirmados pela equipe e evite compartilhar links de atendimento com outras pessoas. Antes de enviar documentos, confira o destinatário e peça orientação sobre o canal apropriado. Esta demonstração ainda não oferece atendimento por vídeo nem envio de documentos reais.'
      THEN 'Use os canais confirmados pela equipe e evite compartilhar links de atendimento com outras pessoas. Antes de enviar documentos, confira o destinatário e peça orientação sobre o canal apropriado. O envio de documentos deve ocorrer somente pelo canal indicado pela equipe.'
    WHEN 'Mensagens administrativas e esta plataforma de demonstração não oferecem atendimento de emergência. Em uma situação de risco imediato, procure um serviço de urgência.'
      THEN 'Mensagens administrativas e esta plataforma não oferecem atendimento de emergência. Em uma situação de risco imediato, procure um serviço de urgência.'
    ELSE block."text"
  END
  WHERE block."articleId" IN (SELECT "id" FROM "targets")
    AND block."text" IN (
      'Use os canais confirmados pela equipe e evite compartilhar links de atendimento com outras pessoas. Antes de enviar documentos, confira o destinatário e peça orientação sobre o canal apropriado. Esta demonstração ainda não oferece atendimento por vídeo nem envio de documentos reais.',
      'Mensagens administrativas e esta plataforma de demonstração não oferecem atendimento de emergência. Em uma situação de risco imediato, procure um serviço de urgência.'
    )
  RETURNING block."articleId"
)
INSERT INTO "AuditEvent" ("id","action","outcome","source","resourceType","resourceId","occurredAt")
SELECT gen_random_uuid(),'DEMONSTRATION_CONTENT_RETIRED','SUCCESS','TRUSTED_MIGRATION','ARTICLE',target."id",CURRENT_TIMESTAMP
FROM "targets" target;
