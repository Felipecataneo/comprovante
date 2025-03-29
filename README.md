## Motivação

Código para uma simples página para ser enviada caso alguém tente te aplicar algum golpe que envolva envio de dinheiro.
Você envia o link da página como se fosse o comprovante e extrai a localização e imagem do golpista.

A idéia partiu do https://github.com/PedroHBessa/backscan

Só precisa fazer o deploy no vercel e adicionar suas variáveis de ambiente dos dados do bot do telegram


##  Criar e Configurar um Bot no Telegram

1. No Telegram, procure por **@BotFather**.
2. Envie o comando:
   ```
   /newbot
   ```
3. Siga as instruções e anote o **token** fornecido.
4. Para obter o **ID do chat/grupo**:
   - Adicione o bot ao grupo.
   - Envie uma mensagem no grupo.
   - Acesse:
     ```
     https://api.telegram.org/botSEU_BOT_TOKEN/getUpdates
     ```
   - Anote o `chat_id`.

---

## Dados para as variáveis de ambiente

TELEGRAM_BOT_TOKEN = seu TELEGRAM_BOT_TOKEN;

TELEGRAM_CHAT_ID = seu TELEGRAM_CHAT_ID;

ambos obtidos no passo a passo anterior

## testar localmente

Servidor de desenvolvimento.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) 



## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
