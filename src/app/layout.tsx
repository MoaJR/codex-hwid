import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Dr. Douglas Vaz | Psiquiatria', description: 'Informação, agendamento e acesso seguro ao acompanhamento em saúde mental.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="pt-BR"><body>{children}</body></html>}
