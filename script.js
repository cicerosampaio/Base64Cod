// Espera o DOM (estrutura da página) ser completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos do DOM ---
    // Botão Home
    const homeButton = document.getElementById('homeButton');

    // Seletores de tipo de entrada
    const inputTypeRadios = document.querySelectorAll('input[name="inputType"]');
    const textInputArea = document.getElementById('textInputArea');
    const imageInputArea = document.getElementById('imageInputArea');
    const urlInputArea = document.getElementById('urlInputArea');

    // Elementos da Drop Zone (Nova estrutura)
    const dropZone = document.getElementById('dropZone');
    const imageFile = document.getElementById('imageFile'); // Input de arquivo (agora oculto)
    const imagePreview = document.getElementById('imagePreview'); // Preview DENTRO da dropzone

    // Campos de entrada restantes
    const textInput = document.getElementById('textInput');
    const imageUrl = document.getElementById('imageUrl');
    const urlPreview = document.getElementById('urlPreview'); // Preview da URL (mantido separado)

    // Seletores de operação e formato
    const encodingTypeSelect = document.getElementById('encodingType');
    const outputFormatRadios = document.querySelectorAll('input[name="outputFormat"]');
    const outputFormatOptions = document.getElementById('outputFormatOptions');

    // Botões de ação
    const encodeButton = document.getElementById('encodeButton');
    const decodeButton = document.getElementById('decodeButton');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');
    const shareButton = document.getElementById('shareButton');

    // Área de resultado e status
    const outputResult = document.getElementById('outputResult');
    const statusMessage = document.getElementById('statusMessage');

    // Elementos do Histórico
    const historyList = document.getElementById('historyList');
    const toggleHistoryButton = document.getElementById('toggleHistoryButton');
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const noHistoryLi = historyList.querySelector('.no-history'); // Mantém referência ao item "vazio"

    // Armazenamento do histórico (usando localStorage)
    let history = JSON.parse(localStorage.getItem('encodingHistory')) || [];

    // --- Funções Auxiliares ---

    /**
     * Mostra uma mensagem de status (sucesso ou erro)
     * @param {string} message - A mensagem a ser exibida.
     * @param {'success' | 'error'} type - O tipo da mensagem.
     */
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`; // Define a classe para estilização
        // Remove a mensagem após alguns segundos
        setTimeout(() => {
            // Verifica se a mensagem ainda é a mesma antes de limpar
            if (statusMessage.textContent === message) {
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
            }
        }, 5000); // Mensagem visível por 5 segundos
    }

     /**
     * Limpa os campos de entrada, resultado, status e pré-visualizações.
     */
    function clearAll() {
        // Limpa inputs
        textInput.value = '';
        imageFile.value = ''; // Limpa a seleção de arquivo do input file
        imageUrl.value = '';
        outputResult.value = '';

        // Limpa previews
        imagePreview.src = '#';
        imagePreview.classList.add('hidden'); // Esconde o preview interno
        urlPreview.src = '#';
        urlPreview.classList.add('hidden'); // Esconde o preview da URL

        // Garante que o prompt da dropzone volte a aparecer
        const prompt = dropZone.querySelector('.drop-zone__prompt');
        if (prompt) prompt.style.display = ''; // Garante que o prompt não fique escondido

        // Limpa status
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';

        // Reseta seletores para o padrão
        document.querySelector('input[name="inputType"][value="text"]').checked = true;
        handleInputTypeChange(); // Atualiza a visibilidade das áreas
        document.querySelector('input[name="outputFormat"][value="raw"]').checked = true;
        encodingTypeSelect.value = 'base64'; // Reseta tipo de codificação
    }

    /**
     * Copia o texto do resultado para a área de transferência usando a API Clipboard.
     */
    async function copyResultToClipboard() {
        if (!outputResult.value) {
            showStatus('Nada para copiar.', 'error');
            return;
        }
        try {
            await navigator.clipboard.writeText(outputResult.value);
            showStatus('Resultado copiado para a área de transferência!', 'success');
        } catch (err) {
            console.error('Erro ao copiar:', err);
            showStatus('Falha ao copiar. Verifique as permissões do navegador.', 'error');
        }
    }

    /**
     * Compartilha o resultado usando a API Web Share, se disponível.
     */
    async function shareResult() {
        if (!outputResult.value) {
            showStatus('Nada para compartilhar.', 'error');
            return;
        }
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Resultado da Codificação',
                    text: `Resultado (${encodingTypeSelect.value}):\n${outputResult.value}`,
                });
                // O navegador cuida da mensagem de sucesso/cancelamento
                // showStatus('Compartilhado com sucesso!', 'success');
            } catch (err) {
                console.error('Erro ao compartilhar:', err);
                // Não mostra erro se o usuário cancelou o compartilhamento
                if (err.name !== 'AbortError') {
                    showStatus('Falha ao compartilhar.', 'error');
                }
            }
        } else {
            showStatus('API de compartilhamento não suportada neste navegador. Copie o resultado manualmente.', 'error');
        }
    }

    /**
     * Adiciona uma entrada ao histórico e atualiza o localStorage.
     * @param {string} type - Tipo da operação (e.g., 'Base64 Encode').
     * @param {string} inputSnippet - Um trecho da entrada.
     * @param {string} outputSnippet - Um trecho da saída.
     * @param {string} fullOutput - A saída completa para reuso/cópia.
     */
    function addToHistory(type, inputSnippet, outputSnippet, fullOutput) {
        const timestamp = new Date().toLocaleString('pt-BR');
        const entry = { type, inputSnippet, outputSnippet, timestamp, fullOutput };

        // Adiciona no início do array
        history.unshift(entry);

        // Limita o tamanho do histórico (ex: 20 itens)
        if (history.length > 20) {
            history.pop(); // Remove o item mais antigo
        }

        // Salva no localStorage
        localStorage.setItem('encodingHistory', JSON.stringify(history));

        // Renderiza o histórico atualizado
        renderHistory();
    }

    /**
     * Renderiza a lista de histórico no HTML.
     */
    function renderHistory() {
        historyList.innerHTML = ''; // Limpa a lista atual

        if (history.length === 0) {
            // Cria o item "Nenhum histórico" se ele não existir (para evitar duplicação)
            if (!historyList.querySelector('.no-history')) {
                 const li = document.createElement('li');
                 li.className = 'no-history';
                 li.textContent = 'Nenhum histórico ainda.';
                 historyList.appendChild(li);
            }
            return;
        }

        // Cria e adiciona cada item do histórico à lista
        history.forEach((entry) => {
            const li = document.createElement('li');

            // Descrição do item
            const description = document.createElement('span');
             // Sanitiza snippets antes de injetar no HTML para segurança básica
             const safeType = entry.type.replace(/</g, "&lt;").replace(/>/g, "&gt;");
             const safeOutputSnippet = entry.outputSnippet.replace(/</g, "&lt;").replace(/>/g, "&gt;");
             const safeTimestamp = entry.timestamp.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            description.innerHTML = `<strong>${safeType}:</strong> ${safeOutputSnippet}... <i>(${safeTimestamp})</i>`;

            // Botões de ação para o item
            const actions = document.createElement('div');
            actions.className = 'history-actions';

            // Botão para reutilizar a saída como entrada de texto
            const reuseButton = document.createElement('button');
            reuseButton.innerHTML = '<i class="fa-solid fa-recycle"></i> Reusar';
            reuseButton.title = 'Usar esta saída como entrada de texto';
            reuseButton.type = 'button'; // Boa prática
            reuseButton.addEventListener('click', () => {
                document.querySelector('input[name="inputType"][value="text"]').checked = true;
                handleInputTypeChange();
                textInput.value = entry.fullOutput;
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola suavemente
                showStatus('Saída do histórico carregada na entrada de texto.', 'success');
            });

             // Botão para copiar a saída completa
            const copyHistButton = document.createElement('button');
            copyHistButton.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar';
            copyHistButton.title = 'Copiar saída completa';
             copyHistButton.type = 'button'; // Boa prática
             copyHistButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(entry.fullOutput);
                    showStatus('Saída do histórico copiada!', 'success');
                } catch (err) {
                     showStatus('Falha ao copiar do histórico.', 'error');
                }
            });

            actions.appendChild(reuseButton);
             actions.appendChild(copyHistButton);
            li.appendChild(description);
            li.appendChild(actions);
            historyList.appendChild(li);
        });
    }

    /**
     * Limpa todo o histórico.
     */
    function clearHistory() {
        if (history.length > 0 && confirm('Tem certeza que deseja limpar todo o histórico?')) {
            history = [];
            localStorage.removeItem('encodingHistory');
            renderHistory();
            showStatus('Histórico limpo.', 'success');
        } else if (history.length === 0) {
             showStatus('Histórico já está vazio.', 'error'); // Usando 'error' para feedback
        }
    }

    /**
     * Alterna a visibilidade da lista de histórico.
     */
    function toggleHistoryVisibility() {
        historyList.classList.toggle('hidden');
        const icon = toggleHistoryButton.querySelector('i');
        const isHidden = historyList.classList.contains('hidden');

        icon.classList.toggle('fa-eye', isHidden);
        icon.classList.toggle('fa-eye-slash', !isHidden);
        toggleHistoryButton.title = isHidden ? "Mostrar Histórico" : "Ocultar Histórico";
    }


    // --- Funções de Leitura de Arquivo/URL ---

    /**
     * Lê um arquivo como ArrayBuffer usando FileReader e Promises com async/await.
     * @param {File} file - O arquivo a ser lido.
     * @returns {Promise<ArrayBuffer>} - O conteúdo do arquivo como ArrayBuffer.
     */
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error); // Passa o erro
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Lê um arquivo como DataURL para pré-visualização.
     * @param {File} file - O arquivo a ser lido.
     * @returns {Promise<string>} - O conteúdo como DataURL (Base64 string).
     */
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error); // Passa o erro
            reader.readAsDataURL(file);
        });
    }

    /**
     * Busca o conteúdo de uma URL como ArrayBuffer.
     * @param {string} url - A URL da imagem.
     * @returns {Promise<ArrayBuffer>} - O conteúdo como ArrayBuffer.
     */
    async function fetchUrlAsArrayBuffer(url) {
        try {
            // Adicionando um timeout simples para a requisição (ex: 15 segundos)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId); // Limpa o timeout se a resposta chegar a tempo

            if (!response.ok) {
                // Tenta fornecer uma mensagem de erro mais útil
                let errorMsg = `Falha ao buscar URL (${response.status})`;
                 if (response.status === 404) errorMsg += ': Recurso não encontrado.';
                 if (response.status === 403) errorMsg += ': Acesso proibido (Verifique permissões/CORS).';
                 // Adicione mais códigos de status conforme necessário
                throw new Error(errorMsg);
            }
            // Verifica o tipo de conteúdo se possível (nem sempre disponível ou confiável)
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.startsWith('image/')) {
                 console.warn(`Conteúdo da URL não parece ser uma imagem (${contentType}). Tentando mesmo assim.`);
            }

            return await response.arrayBuffer();
        } catch (error) {
             console.error("Erro no fetch:", error);
             if (error.name === 'AbortError') {
                  throw new Error('Falha ao buscar URL: Tempo limite excedido.');
             }
             // Tenta re-lançar um erro mais específico
             if (error.message.includes('Failed to fetch')) {
                  throw new Error('Falha ao buscar URL. Verifique a URL, conexão e possíveis problemas de CORS.');
             }
             throw error; // Re-lança outros erros
        }
    }

    // --- Função para Processar Imagem Carregada (Nova) ---
    /**
     * Processa um objeto File de imagem (lê, mostra preview, atualiza input oculto).
     * Chamada pelo input change, drop e paste.
     * @param {File} file - O arquivo de imagem a ser processado.
     */
    async function processImageFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showStatus('Arquivo inválido. Por favor, selecione ou arraste um arquivo de imagem.', 'error');
            return;
        }

        // Limpa preview anterior e status
        imagePreview.classList.add('hidden');
        imagePreview.src = '#';
        statusMessage.className = 'status-message';
        statusMessage.textContent = '';
        outputResult.value = ''; // Limpa resultado anterior também

        try {
            // Mostra o preview dentro da dropzone
            const dataUrl = await readFileAsDataURL(file);
            imagePreview.src = dataUrl;
            imagePreview.classList.remove('hidden');

            // Define o arquivo no input oculto para que processAction possa pegá-lo
            // É necessário criar um DataTransfer para atribuir ao .files
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageFile.files = dataTransfer.files;

            // Avisa que a imagem foi carregada e está pronta para codificar
            showStatus(`Imagem "${file.name}" carregada. Clique em "Codificar".`, 'success');

        } catch (error) {
            console.error('Erro ao processar arquivo de imagem:', error);
            showStatus(`Erro ao ler ou exibir a imagem: ${error.message}`, 'error');
            imagePreview.classList.add('hidden');
            imagePreview.src = '#';
             imageFile.value = ''; // Limpa o input file em caso de erro na leitura
        }
    }


    // --- Função Principal de Processamento ---
    /**
     * Função principal para processar a codificação ou decodificação.
     * @param {'encode' | 'decode'} action - A ação a ser realizada.
     */
    async function processAction(action) {
        const inputType = document.querySelector('input[name="inputType"]:checked').value;
        const encodingType = encodingTypeSelect.value;
        const outputFormat = document.querySelector('input[name="outputFormat"]:checked').value;

        let inputData = null;
        let dataType = 'text'; // 'text', 'binary' (ArrayBuffer)
        let operationDescription = '';
        let inputSnippet = '';
        let sourceFileName = ''; // Para guardar o nome do arquivo original
        let sourceMimeType = 'application/octet-stream'; // Mime type padrão

        try {
            outputResult.value = ''; // Limpa resultado anterior
            statusMessage.className = 'status-message'; // Limpa status

            // 1. Obter Dados de Entrada
            // ------------------------
            if (inputType === 'text') {
                inputData = textInput.value;
                if (!inputData && action === 'encode') throw new Error('Nenhum texto fornecido na entrada.');
                 // Para decode, permite entrada vazia, mas resultará em vazio
                 if (!inputData && action === 'decode') {
                     outputResult.value = '';
                     showStatus('Entrada de texto vazia para decodificar.', 'error'); // Usando error para feedback
                     return; // Interrompe se a entrada estiver vazia para decode
                 }
                dataType = 'text';
                inputSnippet = inputData.substring(0, 30);
            } else if (inputType === 'image') {
                // Pega o arquivo do input file, que foi preenchido por processImageFile
                if (!imageFile.files || imageFile.files.length === 0) {
                     // Se não há arquivo no input, verifica se há um preview visível
                     if (!imagePreview.classList.contains('hidden') && imagePreview.src.startsWith('data:image')) {
                         // Isso indica um estado inconsistente (preview sem arquivo no input) - talvez limpar?
                          throw new Error('Erro interno: Preview visível mas arquivo não encontrado no input. Recarregue a imagem.');
                     } else {
                         throw new Error('Nenhuma imagem carregada. Selecione, arraste ou cole uma imagem primeiro.');
                     }
                } else {
                     const file = imageFile.files[0];
                     sourceFileName = file.name; // Guarda nome do arquivo
                     sourceMimeType = file.type || 'image/png'; // Guarda mime type ou usa png como fallback
                     inputData = await readFileAsArrayBuffer(file); // Lê como binário
                     dataType = 'binary';
                     inputSnippet = sourceFileName;
                }
            } else if (inputType === 'url') {
                const url = imageUrl.value;
                if (!url) throw new Error('Nenhuma URL fornecida.');
                 try {
                    inputData = await fetchUrlAsArrayBuffer(url);
                    dataType = 'binary';
                    inputSnippet = url.substring(0, 40);
                    // Tenta pegar o nome do arquivo da URL (muitas vezes não funciona bem)
                     try { sourceFileName = new URL(url).pathname.split('/').pop() || 'image_from_url'; } catch { sourceFileName = 'image_from_url'; }
                     // Não temos mime type confiável aqui, usaremos um genérico se necessário
                     sourceMimeType = 'image/png'; // Assume PNG ou outro tipo genérico

                 } catch(fetchError){
                      // Mostra erro específico do fetch e interrompe
                      throw fetchError;
                 }
            }

            // 2. Realizar a Operação (Codificar/Decodificar)
            // ----------------------------------------------
            let result = '';
            // Capitaliza a primeira letra de action e encodingType para descrição
            const actionDesc = action.charAt(0).toUpperCase() + action.slice(1);
            const encodingDesc = encodingType.toUpperCase();
            operationDescription = `${encodingDesc} ${actionDesc}`;

            if (encodingType === 'base64') {
                if (action === 'encode') {
                    if (dataType === 'text') {
                        // Usa a biblioteca js-base64 que lida bem com UTF-8
                        result = Base64.encode(inputData);
                    } else { // binary (ArrayBuffer)
                        // Usa a biblioteca js-base64
                        result = Base64.fromUint8Array(new Uint8Array(inputData));
                    }
                } else { // decode
                    if (dataType === 'text') {
                        // Pega a string base64 da entrada
                        const base64Input = textInput.value;
                         if (!base64Input) { // Verifica se há algo para decodificar
                              showStatus('Entrada Base64 vazia para decodificar.', 'error');
                              return;
                         }
                        try {
                             // Verifica se a entrada é Base64 válida ANTES de tentar decodificar
                             // A biblioteca js-base64 não tem um `isValid` robusto por padrão,
                             // podemos usar uma regex simples ou confiar no try/catch.
                             // Regex (pode dar falsos positivos/negativos):
                             // const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
                             // if (!base64Regex.test(base64Input.replace(/\s/g, ''))) {
                             //      throw new Error('Entrada não parece ser Base64 válida.');
                             // }
                             result = Base64.decode(base64Input);
                        } catch (e) {
                             // O decode da biblioteca pode lançar erro se inválido
                            throw new Error(`Falha ao decodificar Base64: ${e.message}. Verifique a entrada.`);
                        }
                    } else { // Não faz sentido decodificar binário para texto diretamente aqui
                        throw new Error('Decodificação Base64 só é suportada para entrada de texto.');
                    }
                }
            } else if (encodingType === 'url') {
                 // URL Encoding/Decoding só funciona com texto
                 if (dataType !== 'text') {
                      throw new Error(`Codificação/Decodificação de URL só funciona com entrada de texto.`);
                 }
                 const textUrlInput = textInput.value;
                 if (!textUrlInput && action === 'encode') throw new Error('Nenhum texto fornecido para codificar URL.');
                 if (!textUrlInput && action === 'decode') {
                     outputResult.value = '';
                     showStatus('Entrada URL vazia para decodificar.', 'error');
                     return;
                 }

                if (action === 'encode') {
                    result = encodeURIComponent(textUrlInput);
                    operationDescription = 'URL Encode';
                } else { // decode
                    try {
                        result = decodeURIComponent(textUrlInput);
                         operationDescription = 'URL Decode';
                    } catch (e) {
                         // Captura erro se a string não for uma sequência URL-encoded válida
                         throw new Error(`Falha ao decodificar URL: ${e.message}. Verifique a entrada.`);
                    }
                }
            } else {
                throw new Error('Tipo de codificação não suportado.');
            }

             // 3. Formatar a Saída (Opcional)
             // -------------------------------
             // Só formata se for encode base64 de binário (imagem/url)
             if (action === 'encode' && encodingType === 'base64' && dataType === 'binary') {
                 if (outputFormat === 'imgTag') {
                     result = `<img src="data:${sourceMimeType};base64,${result}" alt="${sourceFileName || 'Imagem Codificada'}">`;
                     operationDescription += ' (IMG Tag)';
                 } else if (outputFormat === 'faviconTag') {
                     // Favicon geralmente usa x-icon ou png
                     const faviconMime = sourceMimeType.startsWith('image/') ? sourceMimeType : 'image/x-icon';
                     result = `<link rel="icon" type="${faviconMime}" href="data:${faviconMime};base64,${result}">`;
                     operationDescription += ' (Favicon Tag)';
                 }
             } else if (outputFormat !== 'raw' && !(dataType === 'text' && action === 'decode')) {
                  // Se um formato específico foi escolhido mas não se aplica (e não é um decode de texto), avisa.
                  showStatus(`Formato de saída "${outputFormat}" só aplicável para encode Base64 de imagens. Exibindo resultado puro.`, 'error');
             }


            // 4. Exibir Resultado e Adicionar ao Histórico
            // -------------------------------------------
            outputResult.value = result;
            showStatus(`${operationDescription} concluído com sucesso!`, 'success');
            // Adiciona a saída completa ao histórico
            addToHistory(operationDescription, inputSnippet, result.substring(0, 50), result);

        } catch (error) {
            console.error('Erro no processamento:', error);
            // Tenta mostrar a mensagem de erro específica que foi lançada
            showStatus(`Erro: ${error.message || 'Ocorreu um problema desconhecido.'}`, 'error');
            outputResult.value = ''; // Limpa resultado em caso de erro
        }
    }


    // --- Gerenciadores de Eventos ---

    // Recarrega a página ao clicar no botão Home
    homeButton.addEventListener('click', () => location.reload());

    /**
     * Gerencia a visibilidade das áreas de input conforme o tipo selecionado.
     * Também reseta estados específicos de cada tipo.
     */
    function handleInputTypeChange() {
        const selectedType = document.querySelector('input[name="inputType"]:checked').value;

        // Esconde todas as áreas de input específicas primeiro
        textInputArea.classList.add('hidden');
        imageInputArea.classList.add('hidden');
        urlInputArea.classList.add('hidden');
        // Esconde as opções de formato de saída HTML por padrão
        outputFormatOptions.classList.add('hidden');

        // Reseta previews e input de arquivo ao mudar
        imagePreview.classList.add('hidden');
        imagePreview.src = '#';
        urlPreview.classList.add('hidden');
        urlPreview.src = '#';
        imageFile.value = ''; // Limpa seleção anterior
        const prompt = dropZone.querySelector('.drop-zone__prompt');
        if (prompt) prompt.style.display = ''; // Garante visibilidade do prompt


        // Mostra a área correspondente e ajusta botões/opções
        if (selectedType === 'text') {
            textInputArea.classList.remove('hidden');
            decodeButton.disabled = false; // Habilita decode
        } else if (selectedType === 'image') {
            imageInputArea.classList.remove('hidden');
            outputFormatOptions.classList.remove('hidden'); // Mostra opções de tag HTML
            decodeButton.disabled = true; // Desabilita decode para binário
        } else if (selectedType === 'url') {
            urlInputArea.classList.remove('hidden');
            outputFormatOptions.classList.remove('hidden'); // Mostra opções de tag HTML
            decodeButton.disabled = true; // Desabilita decode para binário
        }
         // Limpa o resultado ao trocar a entrada
         // outputResult.value = '';
    }
    // Adiciona o listener para todos os radios de tipo de entrada
    inputTypeRadios.forEach(radio => radio.addEventListener('change', handleInputTypeChange));

    // --- Event Listeners da Drop Zone e Input File ---

    // Gerencia clique na Drop Zone para abrir o seletor de arquivos
    dropZone.addEventListener('click', (e) => {
        // Previne abrir o seletor se o clique foi num botão dentro do histórico (se ele estivesse dentro da dropzone)
        if (e.target.closest('.history-actions button')) return;

        // Permite clicar para selecionar mesmo se já houver preview (para trocar a imagem)
        imageFile.click(); // Dispara o clique no input oculto
    });

    // Gerencia o input de arquivo (quando selecionado pelo clique/programaticamente)
    imageFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            processImageFile(file); // Usa a nova função unificada
        }
    });

    // --- Eventos de Drag and Drop na Drop Zone ---

    // Previne comportamentos padrão do navegador para drag/drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // Adiciona feedback visual ao arrastar sobre
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            // Só adiciona a classe se a entrada de imagem estiver selecionada
            if(document.querySelector('input[name="inputType"][value="image"]').checked) {
                dropZone.classList.add('drop-zone--over');
            }
        }, false);
    });

    // Remove feedback visual ao sair da área ou soltar
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drop-zone--over');
        }, false);
    });

    // Manipula o arquivo solto na área
    dropZone.addEventListener('drop', (event) => {
        // Só processa se a entrada de imagem estiver selecionada
        if(!document.querySelector('input[name="inputType"][value="image"]').checked) {
            showStatus('Selecione "Imagem (Arquivo)" antes de arrastar.', 'error');
            return;
        }

        const dt = event.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            // Pega apenas o primeiro arquivo solto que seja imagem
            let imageFound = false;
            for (let i=0; i < files.length; i++){
                 if(files[i].type.startsWith('image/')){
                      processImageFile(files[i]); // Processa o primeiro arquivo de imagem
                      imageFound = true;
                      break;
                 }
            }
            if(!imageFound){
                 showStatus('Nenhum arquivo de imagem encontrado no drop.', 'error');
            }
        } else {
            showStatus('Nenhum arquivo detectado no drop.', 'error');
        }
    }, false);


    // --- Evento de Colar (Paste) ---

    // Adiciona listener no documento para capturar o evento de colar
    document.addEventListener('paste', (event) => {
        // Só processa se a entrada de imagem estiver selecionada
        const inputTypeImageSelected = document.querySelector('input[name="inputType"][value="image"]').checked;
        if (!inputTypeImageSelected) {
            return; // Ignora o paste se não for para imagem
        }

         // Verifica se o foco não está em um input de texto ou textarea para evitar conflito
         const activeElement = document.activeElement;
         if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') && activeElement !== imageFile) {
              // Se o foco está em outro campo de texto, permite o paste padrão lá.
              return;
         }


        const items = (event.clipboardData || window.clipboardData)?.items;
        if(!items) return; // Sai se não houver clipboardData

        let imageFileFound = null;

        // Itera pelos itens colados para encontrar um arquivo de imagem
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                imageFileFound = items[i].getAsFile();
                break; // Pega o primeiro arquivo de imagem encontrado
            }
        }

        if (imageFileFound) {
            event.preventDefault(); // Previne o comportamento padrão de colar (ex: no body)
            processImageFile(imageFileFound); // Processa o arquivo de imagem colado
        }
        // Se não for imagem, não faz nada, permite o paste padrão se aplicável.
    });


    // --- Event Listeners dos Botões de Ação e Histórico ---

    // Ações dos botões principais
    encodeButton.addEventListener('click', () => processAction('encode'));
    decodeButton.addEventListener('click', () => processAction('decode'));
    copyButton.addEventListener('click', copyResultToClipboard);
    clearButton.addEventListener('click', clearAll);
    shareButton.addEventListener('click', shareResult);

    // Ações dos botões de histórico
    toggleHistoryButton.addEventListener('click', toggleHistoryVisibility);
    clearHistoryButton.addEventListener('click', clearHistory);


    // --- Inicialização ao Carregar a Página ---
    handleInputTypeChange(); // Configura a visibilidade inicial das áreas de input
    renderHistory();         // Renderiza o histórico salvo ao carregar a página
    // historyList.classList.add('hidden'); // Descomente se quiser que o histórico comece fechado

}); // Fim do addEventListener('DOMContentLoaded')