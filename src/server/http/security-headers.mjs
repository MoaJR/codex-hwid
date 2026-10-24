const commonDirectives=[
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "media-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
];

export function createContentSecurityPolicy(environment='production'){
  const development=environment==='development';
  return [
    ...commonDirectives,
    `script-src 'self' 'unsafe-inline'${development?" 'unsafe-eval'":''}`,
    `connect-src 'self'${development?' ws: wss:':''}`,
    ...(development?[]:['upgrade-insecure-requests']),
  ].join('; ');
}

export function getSecurityHeaders(environment='production'){
  return [
    {key:'Content-Security-Policy',value:createContentSecurityPolicy(environment)},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'X-Permitted-Cross-Domain-Policies',value:'none'},
    {key:'Cross-Origin-Opener-Policy',value:'same-origin'},
    {key:'Cross-Origin-Resource-Policy',value:'same-origin'},
    {key:'Permissions-Policy',value:'camera=(), geolocation=(), microphone=(), payment=(), usb=()'},
  ];
}
