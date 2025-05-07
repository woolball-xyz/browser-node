import { useEffect, useRef, useState } from 'react';
import { WebSocketManager } from './WebSocketManager';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connection, setConnection] = useState<'connected' | 'disconnected' | 'loading' | 'error'>('disconnected');
  const [running, setRunning] = useState(false);
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [bytesReceived, setBytesReceived] = useState(0);
  const [testResult, setTestResult] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [nodeCount, setNodeCount] = useState<number>(1);
  const [repoStars, setRepoStars] = useState<number | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Fixed URL for audio file
  const fixedAudioUrl = "https://ia600107.us.archive.org/1/items/whizbangv3n30_2503_librivox/whizbangv3n30_00_fawcett.mp3";
  
  // State for storing text blocks with colors
  const [textBlocks, setTextBlocks] = useState<Array<{text: string, color: string}>>([]);

  // Criar uma ref para o botão
  const testButtonRef = useRef<HTMLButtonElement>(null);
  
  // Fetch GitHub repository stars count
  useEffect(() => {
    async function fetchRepoStars() {
      try {
        const response = await fetch('https://api.github.com/repos/woolball-xyz/woolball-server');
        if (response.ok) {
          const data = await response.json();
          setRepoStars(data.stargazers_count);
        }
      } catch (error) {
        console.error('Error fetching repo stars:', error);
      }
    }
    
    fetchRepoStars();
    
    // Set up an interval to refresh the star count periodically (every 5 minutes)
    const interval = setInterval(fetchRepoStars, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Forcefully disable the button if there's no file
  useEffect(() => {
    if (testButtonRef.current) {
      if (!audioFile) {
        testButtonRef.current.setAttribute('disabled', 'true');
        testButtonRef.current.classList.add('disabled');
      } else if (!isProcessing) {
        testButtonRef.current.removeAttribute('disabled');
        testButtonRef.current.classList.remove('disabled');
      }
    }
  }, [audioFile, isProcessing]);

  // Function to pre-load the audio file
  const loadDefaultAudio = async () => {
    try {
      // Try to load a default audio file from the public folder
      const response = await fetch('/input.wav');
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'input.wav', { type: 'audio/wav' });
        setAudioFile(file);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Default audio file not found, waiting for manual selection');
      return false;
    }
  };

  useEffect(() => {
    // Try to load the default audio file on initialization
    loadDefaultAudio();
  }, []);

  useEffect(() => {
    if (running && containerRef.current) {
      // Clear any previous content first
      containerRef.current.innerHTML = '';
      console.log(`🚀 Starting Woolball with ${nodeCount} node(s)`);
      // Initialize WebSocketManager with nodeCount
      wsManagerRef.current = new WebSocketManager(containerRef.current, setConnection, nodeCount);
      
      // Log the node count for verification
      console.log(`📊 Node count: ${nodeCount}`);
    }
    if (!running && wsManagerRef.current) {
      console.log('📴 Stopping Woolball');
      wsManagerRef.current.destroy();
      wsManagerRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      setConnection('disconnected');
    }
    
    return () => {
      if (wsManagerRef.current) {
        console.log('🧹 Cleaning up WebSocketManager');
        wsManagerRef.current.destroy();
        wsManagerRef.current = null;
      }
    };
  }, [running, nodeCount]);

  // Adding a useEffect to monitor the audioFile state
  useEffect(() => {
    console.log("Audio file state changed:", audioFile ? audioFile.name : "null");
  }, [audioFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError('');
    
    if (file) {
      // Validate if it's an audio or video file
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        setFileError('Please select a valid audio or video file.');
        setAudioFile(null);
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setFileError('File size exceeds 50MB limit.');
        setAudioFile(null);
        return;
      }
      
      setAudioFile(file);
    } else {
      setAudioFile(null);
    }
  };

  // Função para gerar cores aleatórias pastéis (mais suaves)
  const getRandomPastelColor = () => {
    // Gerar cores claras com alta luminosidade
    const hue = Math.floor(Math.random() * 360); // 0-359 (todas as cores do espectro)
    const saturation = 50 + Math.floor(Math.random() * 30); // 50-79% (moderada)
    const lightness = 75 + Math.floor(Math.random() * 15); // 75-89% (clara)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const startProcessing = async () => {
    // Reset estados
    setIsProcessing(true);
    setBytesReceived(0);
    setFileError('');
    setProcessingStatus('Distributing tasks...');
    
    // Primeiro estado: Distributing tasks...
    console.log('Step 1: Distributing tasks...');
    
    // Forçar um atraso de 3 segundos neste estado
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Segundo estado: Processing...
    console.log('Step 2: Processing...');
    setProcessingStatus('Processing...');
    
    // Aguarde mais 2 segundos neste estado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Agora podemos realmente iniciar o download e processamento
    try {
      console.log(`🎤 Fetching audio from fixed URL: ${fixedAudioUrl}`);
      
      const response = await fetch(fixedAudioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = fixedAudioUrl.split('/').pop() || 'audio-file.mp3';
      const file = new File([blob], fileName, { type: 'audio/mpeg' });
      
      setAudioFile(file);
      
      // Processar o arquivo
      await processAudioFile(file);
      
    } catch (error) {
      console.error('Error fetching file from URL:', error);
      setFileError(`Error fetching file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const processAudioFile = async (file: File) => {
    try {
      console.log('🎤 Starting Speech Recognition process');
      console.log(`File: ${file.name} (${file.type}, ${Math.round(file.size/1024)} KB)`);
      
      // Reset text blocks
      setTextBlocks([]);
      
      const formData = new FormData();
      formData.append('input', file);
      formData.append('model', 'onnx-community/whisper-small');
      formData.append('dtype', 'q4');
      formData.append('language', 'en');
      formData.append('return_timestamps', 'false');
      formData.append('stream', 'true');

      console.log('📤 Sending request to API:', {
        model: 'onnx-community/whisper-small',
        dtype: 'q4',
        language: 'en',
        return_timestamps: false,
        stream: true
      });

      const response = await fetch('http://localhost:9002/api/v1/speech-recognition', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log('✅ API response received, starting stream processing');
      
      // Process the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        console.error('❌ Failed to get response reader');
        throw new Error('Failed to get response reader');
      }
      
      // Terceiro estado: Receiving data...
      console.log('Step 3: Receiving data...');
      
      // Variável local para manter o controle dos bytes 
      // (evita problemas com closure e state)
      let totalBytesReceived = 0;
      
      // Iniciar com 0 KB
      updateBytesDisplay(0);
      
      let chunkCounter = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('📝 Stream completed');
          break;
        }
        
        chunkCounter++;
        
        // Se temos dados, atualize a contagem de bytes
        if (value) {
          totalBytesReceived += value.length;
          updateBytesDisplay(totalBytesReceived);
        }
        
        const chunk = decoder.decode(value);
        console.log(`📦 Chunk #${chunkCounter} received: ${value?.length || 0} bytes (total: ${totalBytesReceived} bytes)`);
        
        try {
          // Tenta extrair o texto do JSON
          const data = JSON.parse(chunk);
          
          // Caso 1: Se o resultado é um array de objetos com propriedade text
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item.text) {
                const color = getRandomPastelColor();
                console.log(`📝 Transcription (array item): "${item.text}"`);
                setTextBlocks(prevBlocks => [{text: item.text, color}, ...prevBlocks]);
              }
            }
          }
          // Caso 2: Se o resultado é um objeto único com propriedade text
          else if (data.text) {
            const color = getRandomPastelColor();
            console.log(`📝 Transcription (single object): "${data.text}"`);
            setTextBlocks(prevBlocks => [{text: data.text, color}, ...prevBlocks]);
          }
          // Caso 3: Se o resultado não tem a estrutura esperada, mostra o JSON
          else {
            console.log(`⚠️ No text property found in data:`, data);
            console.dir(data); // Log full object details
            const color = getRandomPastelColor();
            // Tenta extrair qualquer texto presente no objeto
            let extractedText = JSON.stringify(data);
            console.log(`📄 Raw JSON data: ${extractedText}`);
            setTextBlocks(prevBlocks => [{text: extractedText, color}, ...prevBlocks]);
          }
        } catch (e) {
          // Se não conseguir fazer parse, mostra o chunk como texto bruto
          console.warn('⚠️ Failed to parse chunk:', chunk, e);
          console.log('🔍 Raw chunk content:', chunk);
          console.error('❌ Parse error details:', e);
          
          const color = getRandomPastelColor();
          setTextBlocks(prevBlocks => [{text: chunk, color}, ...prevBlocks]);
        }
      }
      
      console.log('🎉 Speech Recognition process completed successfully');
      
      // Set a final success status with bytes received info
      setProcessingStatus(`${totalBytesReceived} bytes received - Check DevTools for results`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in Speech Recognition process:', errorMessage);
      setTestResult(`Error: ${errorMessage}`);
      setTextBlocks([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Função auxiliar para atualizar a exibição de bytes
  function updateBytesDisplay(bytes: number) {
    setBytesReceived(bytes);
    // Apenas defina o status base, o componente vai mostrar os bytes separadamente
    setProcessingStatus('Receiving data...');
  }

  // Função para baixar arquivo de uma URL
  const handleUrlSubmit = async () => {
    if (!fileUrl.trim()) {
      setFileError('Please enter a valid URL');
      return;
    }

    setFileError('');
    setIsProcessing(true);

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      // Obter extensão do URL para determinar o tipo
      const urlParts = fileUrl.split('.');
      const extension = urlParts[urlParts.length - 1].toLowerCase();
      
      // Mapear extensão para MIME type
      let mimeType = 'audio/mpeg'; // padrão
      if (['mp3'].includes(extension)) mimeType = 'audio/mpeg';
      if (['wav'].includes(extension)) mimeType = 'audio/wav';
      if (['mp4'].includes(extension)) mimeType = 'video/mp4';
      if (['ogg'].includes(extension)) mimeType = 'audio/ogg';
      if (['webm'].includes(extension)) mimeType = 'audio/webm';

      const blob = await response.blob();
      const fileName = fileUrl.split('/').pop() || 'audio-file';
      const file = new File([blob], fileName, { type: mimeType });
      
      setAudioFile(file);
    } catch (error) {
      console.error('Error fetching file from URL:', error);
      setFileError(`Error fetching file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusText = {
    loading: 'Connecting to server... waiting for tasks',
    connected: `Connected to Woolball server`,
    disconnected: 'You are offline',
    error: 'Connection error'
  }[connection];

  const handleButton = () => {
    if (running) {
      console.log('🛑 Stopping Woolball service');
      setRunning(false);
    } else {
      console.log(`▶️ Starting Woolball service with ${nodeCount} node(s)`);
      setRunning(true);
    }
  };

  // Renderiza os blocos de texto com cores de fundo
  const renderTextBlocks = () => {
    if (textBlocks.length === 0) {
      return testResult;
    }
    
    return (
      <div>
        {textBlocks.map((block, index) => (
          <div 
            key={index} 
            style={{
              backgroundColor: block.color,
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '4px'
            }}
          >
            {block.text}
          </div>
        ))}
      </div>
    );
  };

  // Função de clique que OBRIGATORIAMENTE verifica se existe um arquivo
  const onClickTestButton = (e: React.MouseEvent) => {
    // Verifica se há um arquivo antes de continuar
    if (!audioFile) {
      e.preventDefault();
      setFileError("Please select a file first");
      return;
    }
    
    // Se tudo estiver ok, inicia o processamento
    startProcessing();
  };

  // Function to generate cURL command
  const generateCurlCommand = () => {
    const apiEndpoint = 'http://localhost:9002/api/v1/speech-recognition';
    return `curl -X POST \\
  "${apiEndpoint}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "input=@your-audio-file.mp3" \\
  -F "model=onnx-community/whisper-small" \\
  -F "dtype=q4" \\
  -F "language=en" \\
  -F "return_timestamps=false" \\
  -F "stream=true"`;
  };

  // Function to copy cURL to clipboard
  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(generateCurlCommand())
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };

  return (
    <div className="main-bg central-layout">
      <header className="app-header">
        <span className={`logo-dot connection-${connection}`} title={statusText} />
        <h1 className="app-title">AI Node</h1>
        <button 
          onClick={() => setRightDrawerOpen(prev => !prev)}
          className="drawer-toggle"
          aria-label="Toggle right drawer"
        >
          ☰
        </button>
      </header>
      
      {/* Mobile links positioned below header for consistent visibility */}
      <div className="mobile-links">
        <a href="https://github.com/woolball-xyz/woolball-server" className="repo-link" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{marginRight: "4px"}}>
            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          <div style={{flex: 1}}>Woolball Server</div>
          {repoStars !== null && (
            <span className="stars-count">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path>
              </svg>
              {repoStars}
            </span>
          )}
        </a>
      </div>

      <div className="central-content">
        <div className="content-wrapper">
          <div className="main-content-area">
            {running ? (
              // Show only the events container when running
              <div ref={containerRef} className="events-container">
                {/* Events will be dynamically added here */}
              </div>
            ) : (
              // Show the configuration UI only when not running
              <>
                {/* Node selector section */}
                <div className="config-section">
                  <div className="node-selector-container">
                    <h3 className="node-selector-title">Parallel Processing Nodes</h3>
                    <div className="node-controls">
                      <button 
                        className="node-control-btn" 
                        onClick={() => setNodeCount(prev => Math.max(1, prev - 1))}
                      >
                        -
                      </button>
                      <div className="node-count">
                        <span className="node-count-value">{nodeCount}</span>
                        <span className="node-count-label">node{nodeCount !== 1 ? 's' : ''}</span>
                      </div>
                      <button 
                        className="node-control-btn" 
                        onClick={() => setNodeCount(prev => Math.min(16, prev + 1))}
                      >
                        +
                      </button>
                    </div>
                    <div className="node-description">
                      Each node represents a separate Woolball instance running in parallel.
                      <span className="node-description-icon">🧶</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button
            className={`main-action-btn ${running ? 'stop' : 'start'}`}
            onClick={handleButton}
          >
            {running ? 'STOP' : 'START'}
          </button>
          
          <div className="status-main-text">
            <span className={`status-badge status-${connection}`}>
              {connection === 'connected' 
                ? `Connected to Woolball server with ${nodeCount} node${nodeCount !== 1 ? 's' : ''}` 
                : statusText}
            </span>
          </div>
        </div>

        <div className={`right-drawer ${rightDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-section">
            <h2 className="drawer-title">Links</h2>
            <div className="repo-links">
              <a href="https://github.com/woolball-xyz/woolball-server" className="repo-link" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{marginRight: "4px"}}>
                  <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                <div style={{flex: 1}}>Woolball Server</div>
                {repoStars !== null && (
                  <span className="stars-count">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path>
                    </svg>
                    {repoStars}
                  </span>
                )}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom bar replacing the left drawer */}
      <div className="fixed-bottom-bar">
        <div className="test-cards-container">
          {/* Speech Recognition Test Card */}
          <div className="http-test-card">
            <div className="http-test-top-line">
              <div className="http-test-method">POST</div>
              <span className="http-test-service-name">Speech to text</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">onnx-community/whisper-small</span>
              <div className="card-actions">
                <button 
                  className={`copy-curl-button ${copiedToClipboard ? 'copied' : ''}`}
                  onClick={copyCurlToClipboard}
                  aria-label="Copy cURL command to clipboard"
                >
                  <span className="copy-icon">
                    {copiedToClipboard ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                      </svg>
                    )}
                  </span>
                  <span className="tooltip">Copy cURL</span>
                </button>
                <button 
                  className={`play-button ${isProcessing ? 'processing' : ''}`}
                  onClick={startProcessing}
                  aria-label="Run test with default audio file"
                  disabled={isProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {processingStatus}
                {bytesReceived > 0 && (
                  <span className="bytes-counter">({bytesReceived} bytes)</span>
                )}
              </div>
            ) : textBlocks.length > 0 ? (
              <div className="success-message">
                <span className="check-icon">✓</span>
                {processingStatus && processingStatus.includes("Completed") 
                  ? processingStatus 
                  : "Check DevTools for results"}
              </div>
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
            
            {fileError && <div className="file-error">{fileError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;