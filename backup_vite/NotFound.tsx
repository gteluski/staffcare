import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center max-w-md">
        <h1 className="mb-3 text-5xl font-heading font-bold text-primary">404</h1>
        <p className="mb-2 text-lg font-heading text-foreground">Página não encontrada</p>
        <p className="mb-6 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild>
          <a href="/">
            <Home className="h-4 w-4 mr-2" />
            Voltar ao início
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
