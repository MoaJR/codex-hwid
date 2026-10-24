import {getSecurityHeaders} from './src/server/http/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig={
  experimental:{
    useTypeScriptCli:false,
  },
  async headers(){
    return [{source:'/:path*',headers:getSecurityHeaders(process.env.NODE_ENV)}];
  },
};

export default nextConfig;
