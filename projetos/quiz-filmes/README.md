# Quiz de Filmes

Projeto de quiz de filmes feito com:

- HTML
- CSS
- JavaScript puro
- Firebase Authentication
- Firestore
- GitHub Pages

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie os arquivos:
   - index.html
   - style.css
   - firebase-config.js
   - app.js
   - README.md
3. Vá em Settings > Pages.
4. Em Source, escolha a branch principal e a pasta root.
5. Salve e aguarde o link do GitHub Pages.

## Como configurar Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication.
3. Em Sign-in method, ative Email/Password.
4. Ative Firestore Database.
5. Copie as credenciais do seu projeto para firebase-config.js.

## Login por nome de usuário

Como o Firebase usa email e senha, o sistema converte automaticamente:

usuario123 -> usuario123@quizlocal.app

Na tela, o usuário vê apenas:
- nome de usuário
- senha

## Como liberar admin

Depois de criar sua conta, vá no Firestore e altere o documento:

users / SEU_UID

Troque:

"isAdmin": false

para:

"isAdmin": true

## Estrutura do banco

### users
```json
{
  "username": "seunome",
  "isAdmin": false,
  "createdAt": "timestamp"
}