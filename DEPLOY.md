# Como publicar na Vercel

## 1. Criar repositório no GitHub

1. Acede a [github.com](https://github.com) e faz login
2. Clica no **+** (canto superior direito) → **New repository**
3. Preenche:
   - **Repository name:** `news-portugal` (ou outro nome)
   - **Description:** "Aplicação de notícias de Portugal e internacionais"
   - Deixa **Public**
   - **Não** assinales "Add a README" (já tens ficheiros)
4. Clica **Create repository**

## 2. Enviar o código para o GitHub

Abre o terminal na pasta do projeto e executa:

```powershell
cd "c:\Users\csjdj\OneDrive\Documentos\News"

# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os ficheiros
git add .

# Primeiro commit
git commit -m "Versão inicial - Notícias Portugal e Mundo"

# Adicionar o repositório remoto (substitui TEU_USUARIO e news-portugal pelo teu)
git remote add origin https://github.com/TEU_USUARIO/news-portugal.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

**Importante:** Substitui `TEU_USUARIO` pelo teu nome de utilizador do GitHub e `news-portugal` pelo nome do repositório que criaste.

## 3. Publicar na Vercel

1. Acede a [vercel.com](https://vercel.com) e faz login (podes usar a conta GitHub)
2. Clica **Add New** → **Project**
3. Importa o repositório `news-portugal` (ou o nome que escolheste)
4. A Vercel deteta automaticamente que é um projeto Node.js
5. Clica **Deploy**
6. Aguarda alguns minutos
7. A app ficará disponível em `https://news-portugal-xxx.vercel.app` (ou URL personalizada)

## 4. Configuração na Vercel

O projeto já inclui:
- `vercel.json` – configuração para o Vercel
- `api/index.js` – adaptação para serverless
- `.gitignore` – ignora `node_modules` e ficheiros sensíveis

Nada a alterar; o deploy deve funcionar sem configuração extra.
