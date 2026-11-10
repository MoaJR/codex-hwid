import {getSecurityHeaders} from './src/server/http/security-headers.mjs';

// Rotas anteriores à unificação do painel (11/2026). Redirecionamento permanente
// apenas de navegação; a autorização continua nos guards de cada página nova.
const legacyPanelRoutes=[
  ['/admin','/painel/administracao'],
  ['/conta','/painel/conta'],
  ['/paciente','/painel/acompanhamento'],
  ['/medico/agenda','/painel/agenda'],
  ['/medico/conteudos','/painel/conteudos'],
  ['/medico/conteudos/novo','/painel/conteudos/novo'],
  ['/medico/conteudos/:id','/painel/conteudos/:id'],
];

/** @type {import('next').NextConfig} */
const nextConfig={
  experimental:{
    useTypeScriptCli:false,
  },
  async redirects(){
    return legacyPanelRoutes.map(([source,destination])=>({source,destination,permanent:true}));
  },
  async headers(){
    return [{source:'/:path*',headers:getSecurityHeaders(process.env.NODE_ENV)}];
  },
};

export default nextConfig;
