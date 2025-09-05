// src/app/app-react/[[...slug]]/page.tsx
import fs from 'fs';
import path from 'path';

// Esta página captura todas as rotas /app-react/* e serve o HTML da SPA
export default function ReactApp() {
  return (
    <div 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      <iframe
        src="/app-react/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="React Application"
      />
    </div>
  );
}

// Alternativa: Servir o HTML diretamente (mais complexo)
export async function generateStaticParams() {
  return []; // Permite rotas dinâmicas
}

// Se quiser servir o HTML diretamente sem iframe:
/*
export default async function ReactApp() {
  const htmlPath = path.join(process.cwd(), 'public', 'app-react', 'index.html');
  
  try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    return (
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar a aplicação</h1>
          <p className="text-gray-600">
            Certifique-se de que o build da aplicação React foi executado.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Execute: <code className="bg-gray-100 px-2 py-1 rounded">npm run build</code> na aplicação React
          </p>
        </div>
      </div>
    );
  }
}
*/