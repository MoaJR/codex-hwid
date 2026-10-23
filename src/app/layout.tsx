import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Dr. Douglas Vaz | Psiquiatria', description: 'Plataforma de cuidado em saúde mental. Ambiente em desenvolvimento.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="pt-BR"><body>{children}</body></html>}
