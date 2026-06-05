#!/bin/bash

# NeuroStudy AI - Setup Script

echo "🚀 Iniciando setup do NeuroStudy AI..."

# Install dependencies
echo "📦 Instalando dependências..."
npm install

# Create environment file
echo "🔧 Configurando variáveis de ambiente..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ .env.local criado (configure seus valores)"
fi

# Create test directory
echo "📁 Criando diretório de testes..."
mkdir -p src/test

# Run type checking
echo "🔍 Verificando tipos..."
npm run type-check

# Run linting
echo "✨ Verificando código..."
npm run lint || true

# Run tests
echo "🧪 Executando testes..."
npm run test || true

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Configure .env.local com suas credenciais"
echo "2. Execute 'npm run dev' para iniciar o servidor de desenvolvimento"
echo "3. Acesse http://localhost:5173"
echo ""
