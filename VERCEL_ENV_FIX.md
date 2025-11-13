# 🔧 CORREÇÕES URGENTES - Variáveis de Ambiente Vercel

## ❌ PROBLEMA IDENTIFICADO

A autenticação falha silenciosamente porque `NEXTAUTH_URL` está **SEM** o protocolo `https://`

## ✅ CORREÇÕES NECESSÁRIAS NO VERCEL

Acesse: https://vercel.com/patrick-santos-projects/stocklio/settings/environment-variables

### 1. NEXTAUTH_URL (CRÍTICO!)

**Valor ATUAL (ERRADO):**
```
stocklio-eight.vercel.app
```

**Valor CORRETO:**
```
https://stocklio-eight.vercel.app
```

**Passos:**
1. Encontre a variável `NEXTAUTH_URL` na lista
2. Clique no botão de editar (ícone de lápis)
3. Altere para: `https://stocklio-eight.vercel.app`
4. Marque para aplicar em **Production** e **Preview**
5. Salve

### 2. Verificar DATABASE_URL (Production)

**Verifique se o valor é:**
```
postgresql://neondb_owner:npg_uFTzXqeBO5I4@ep-damp-glade-a4yiy6tu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Se estiver diferente, corrija para o valor acima.

### 3. NEXTAUTH_SECRET

Verifique se está preenchido. Deve ser uma string longa e aleatória.

## 🚀 APÓS CORRIGIR

1. As variáveis serão aplicadas no próximo deploy
2. Faça um redeploy manual ou aguarde o próximo push
3. Teste o login novamente

## 🔍 COMO VERIFICAR SE FUNCIONOU

1. Acesse: https://stocklio-eight.vercel.app/auth/signin
2. Faça login com suas credenciais
3. Você deve ser redirecionado para: https://stocklio-eight.vercel.app/dashboard
4. A URL **NÃO** deve conter `?callbackUrl=...`

## ⚠️ IMPORTANTE

Se mesmo após corrigir o problema persistir, verifique:
- Os logs do deployment no Vercel
- Se o usuário existe no banco de dados Neon
- Se a senha está correta
