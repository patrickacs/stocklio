# 🔒 STOCKLIO - Guia de Segurança

## ⚠️ **NUNCA COMPARTILHE ESTAS INFORMAÇÕES:**

### **🚫 Arquivos que NUNCA devem ser commitados:**
- `.env`
- `.env.local` 
- `.env.production`
- Qualquer arquivo com API keys reais

### **🚫 Informações sensíveis:**
- `DATABASE_URL` (connection strings)
- `NEXTAUTH_SECRET` (chave de autenticação)
- `ALPHA_VANTAGE_API_KEY`
- `FMP_API_KEY`
- `YAHOO_FINANCE_API_KEY`

## ✅ **Como Compartilhar o Projeto Seguramente:**

### **1. Antes de Commitar:**
```bash
# Verificar se .env.local está no .gitignore
git status

# Não deve aparecer .env.local na lista
```

### **2. Arquivo .env.example:**
```bash
# ✅ Este arquivo pode ser commitado
# ❌ Não coloque valores reais aqui
# ✅ Use apenas exemplos/placeholders
```

### **3. Para Colaboradores:**
```bash
# 1. Clone o repositório
git clone seu-repo

# 2. Copie o arquivo de exemplo
cp .env.example .env.local

# 3. Preencha com suas próprias keys
# (cada pessoa deve ter suas próprias keys)
```

## 🔑 **APIs Keys - Como Obter:**

### **Alpha Vantage (Gratuito):**
- Site: https://www.alphavantage.co/support/#api-key
- Limite: 25 requests/dia (gratuito)
- Limite: 500 requests/dia (premium)

### **Financial Modeling Prep:**
- Site: https://financialmodelingprep.com/developer/docs
- Limite: 250 requests/dia (gratuito)

### **Yahoo Finance:**
- Via RapidAPI: https://rapidapi.com/apidojo/api/yahoo-finance1
- Limite: 500 requests/mês (gratuito)

## 🛡️ **Configuração Segura:**

### **Desenvolvimento Local:**
```bash
# .env.local (NÃO COMMITAR)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="sua-chave-super-secreta"
ALPHA_VANTAGE_API_KEY="sua-key-real"
```

### **Produção (Vercel):**
```bash
# Configurar no dashboard da Vercel
# Settings → Environment Variables
```

## 🚨 **Se Você Acidentalmente Commitou Keys:**

### **1. Remover do Git:**
```bash
# Remover arquivo do histórico
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch .env.local' \
--prune-empty --tag-name-filter cat -- --all

# Force push (CUIDADO!)
git push --force --all
```

### **2. Revogar Keys:**
- **Imediatamente** revogue/regenere todas as API keys
- Mude todas as senhas
- Gere novo `NEXTAUTH_SECRET`

### **3. Atualizar Produção:**
- Atualize todas as variáveis na Vercel
- Redeploy a aplicação

## 🎯 **Boas Práticas:**

### **✅ Faça:**
- Use `.env.example` para documentar
- Configure `.gitignore` corretamente
- Use variáveis de ambiente diferentes para dev/prod
- Monitore logs para vazamentos acidentais
- Use keys com escopo limitado quando possível

### **❌ Não Faça:**
- Hardcode keys no código
- Commite arquivos `.env`
- Compartilhe keys por email/chat
- Use keys de produção em desenvolvimento
- Deixe keys em logs públicos

## 🔍 **Verificação de Segurança:**

```bash
# Verificar se não há keys no código
grep -r "sk_" . --exclude-dir=node_modules
grep -r "pk_" . --exclude-dir=node_modules
grep -r "API_KEY" . --exclude-dir=node_modules

# Verificar .gitignore
cat .gitignore | grep env
```

## 📞 **Em Caso de Emergência:**

1. **Revogue todas as keys imediatamente**
2. **Mude todas as senhas**
3. **Notifique a equipe**
4. **Monitore uso suspeito**
5. **Documente o incidente**

---

**Lembre-se: Segurança é responsabilidade de todos!** 🔒
