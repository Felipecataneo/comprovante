// app/layout.js
import './globals.css'; // Importa os estilos globais

// Exporta os metadados para o Next.js gerar as tags <meta> corretas
export const metadata = {
  title: 'Comprovante de Pagamento', // Título da página
  description: 'Segue seu comprovante',
  openGraph: {
    title: 'Comprovante de Pagamento',
    description: 'Segue seu comprovante',
    // A URL deve ser absoluta para og:image
    // Next.js pode precisar da URL completa, especialmente se o domínio for customizado
    // Se estiver na Vercel, você pode usar process.env.VERCEL_URL ou configurar um env var
    // Para simplificar, vamos hardcodar por enquanto, mas o ideal é usar variável de ambiente
    images: [
        {
            // Use o caminho absoluto a partir da pasta public
            url: '/comprovante.jpeg', // Ajuste se necessário, pode precisar da URL completa
            width: 800, // Especifique dimensões se souber
            height: 600,
            alt: 'Imagem do Comprovante',
        },
    ],
    type: 'website', // Ou 'article', etc.
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children} {/* Aqui é onde o conteúdo da sua `page.js` será renderizado */}
      </body>
    </html>
  );
}