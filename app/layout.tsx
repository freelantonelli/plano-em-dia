import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plano em Dia: acompanhamento do Programa de Governo 2027–2030",
  description:
    "Acompanhamento independente dos compromissos do Programa de Governo registrado no TSE: o que foi prometido, quem responde por cada item e onde cobrar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
