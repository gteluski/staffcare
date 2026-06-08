import '../index.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Staffcare',
  description: 'Plataforma integrada de gestão para igrejas metodistas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        <Providers>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
