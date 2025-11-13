#!/bin/bash

echo "🚀 STOCKLIO - Deploy Script"
echo "=========================="

# Verificar se está logado na Vercel
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrada. Instalando..."
    npm install -g vercel
fi

# Verificar se tem .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Crie o arquivo com suas variáveis de ambiente."
    echo "📖 Consulte o DEPLOY.md para instruções."
    exit 1
fi

# Build local para testar
echo "🔨 Testando build local..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build falhou! Corrija os erros antes do deploy."
    exit 1
fi

echo "✅ Build local bem-sucedido!"

# Deploy na Vercel
echo "🚀 Fazendo deploy na Vercel..."
vercel --prod

echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://seu-app.vercel.app"
echo "⚙️  Configure as variáveis de ambiente no dashboard da Vercel"
echo "📖 Consulte o DEPLOY.md para mais detalhes"
