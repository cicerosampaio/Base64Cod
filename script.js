document.addEventListener("DOMContentLoaded", function() {
    // Seleciona os elementos HTML necessários
    const arquivoRadio = document.getElementById("arquivoRadio");
    const urlRadio = document.getElementById("urlRadio");
    const tipoSaidaGroup = document.getElementById("tipoSaidaGroup");
    const faviconCheckbox = document.getElementById("faviconCheckbox");
    const imagemCheckbox = document.getElementById("imagemCheckbox");
    const imagemInput = document.getElementById("imagemInput");
    const urlInput = document.getElementById("urlInput");
    const miniaturaImagem = document.getElementById("miniaturaImagem");
    const base64Resultado = document.getElementById("base64Resultado");
    const copiarBotao = document.getElementById("copiarBotao");
    const baixarBotao = document.getElementById("baixarBotao");
    const inicioBotao = document.getElementById('inicioBotao');
    const barraProgresso = document.getElementById("barraProgresso");
    let tipoSaida = [];

    // Cria o telhado da casa
        const telhado = document.createElement('div');
        telhado.classList.add('telhado');
        inicioBotao.appendChild(telhado);

    // Cria o corpo da casa
        const corpo = document.createElement('div');
        corpo.classList.add('corpo');
        inicioBotao.appendChild(corpo);

    // Adiciona o evento de click para atualizar a página
        inicioBotao.addEventListener('click', () => {
        location.reload();
});

    // Evento para quando o rádio "Arquivo" é selecionado
    arquivoRadio.addEventListener("change", function() {
        // Mostra o grupo de seleção de tipo de saída e o input de arquivo
        tipoSaidaGroup.style.display = "block";
        imagemInput.style.display = "block";
        // Esconde o input de URL e limpa os campos
        urlInput.style.display = "none";
        limparCampos();
    });

    // Evento para quando o rádio "URL" é selecionado
    urlRadio.addEventListener("change", function() {
        // Mostra o grupo de seleção de tipo de saída e o input de URL
        tipoSaidaGroup.style.display = "block";
        urlInput.style.display = "block";
        // Esconde o input de arquivo e limpa os campos
        imagemInput.style.display = "none";
        limparCampos();
    });

    // Evento para cada rádio de tipo de saída (favicon ou imagem)
    document.querySelectorAll("input[name='tipoSaida']").forEach(radio => {
        radio.addEventListener("change", function() {
            // Atualiza a variável tipoSaida com o valor do rádio selecionado
            tipoSaida = this.value;
        });
    });

    // Evento para quando um arquivo é selecionado no input de arquivo
    imagemInput.addEventListener("change", function() {
        const arquivo = this.files[0];
        if (arquivo) {
            // Exibe a miniatura da imagem e codifica o arquivo
            exibirMiniatura(arquivo);
            codificarArquivo(arquivo);
        }
    });

    // Evento para quando a URL é alterada no input de URL
    urlInput.addEventListener("change", function() {
        const url = this.value;
        if (url) {
            // Exibe a miniatura da imagem a partir da URL e codifica a URL
            miniaturaImagem.src = url;
            miniaturaImagem.style.display = "block";
            codificarUrl(url);
        }
    });

    // Evento para o botão "Copiar"
    copiarBotao.addEventListener("click", copiarTexto);
    // Evento para o botão "Baixar"
    baixarBotao.addEventListener("click", baixarTexto);

    // Função para exibir a miniatura da imagem a partir de um arquivo
    function exibirMiniatura(arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            // Define a fonte da miniatura e a exibe
            miniaturaImagem.src = e.target.result;
            miniaturaImagem.style.display = "block";
        };
        leitor.readAsDataURL(arquivo);
    }

    // Função para codificar um arquivo em Base64
    function codificarArquivo(arquivo) {
        const leitor = new FileReader();
        // Mostra a barra de progresso
        barraProgresso.style.display = "block";

        leitor.onload = function(evento) {
            // Simula um atraso de 3 segundos
            setTimeout(function() {
                try {
                    // Converte o ArrayBuffer para Uint8Array e codifica em Base64
                    const base64String = Base64.fromUint8Array(new Uint8Array(evento.target.result));
                    // Exibe o resultado e esconde a barra de progresso
                    exibirResultado(base64String);
                    barraProgresso.style.display = "none";
                    alert("Código Gerado com Sucesso!");
                } catch (erro) {
                    // Em caso de erro, esconde a barra de progresso e exibe um alerta
                    barraProgresso.style.display = "none";
                    alert("Falha ao Decodificar Imagem.");
                }
            }, 3000);
        };

        leitor.readAsArrayBuffer(arquivo);
    }

    // Função para codificar uma URL em Base64
    function codificarUrl(url) {
        // Mostra a barra de progresso
        barraProgresso.style.display = "block";
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(buffer => {
                // Simula um atraso de 3 segundos
                setTimeout(function() {
                    try {
                        // Converte o ArrayBuffer para Uint8Array e codifica em Base64
                        const base64String = Base64.fromUint8Array(new Uint8Array(buffer));
                        // Exibe o resultado e esconde a barra de progresso
                        exibirResultado(base64String);
                        barraProgresso.style.display = "none";
                        alert("Código Gerado com Sucesso!");
                    } catch (erro) {
                        // Em caso de erro, esconde a barra de progresso e exibe um alerta
                        barraProgresso.style.display = "none";
                        alert("Falha ao Decodificar Imagem.");
                    }
                }, 3000);
            })
            .catch(erro => {
                // Em caso de erro na requisição, esconde a barra de progresso e exibe um alerta
                barraProgresso.style.display = "none";
                alert("Falha ao Decodificar Imagem.");
            });
    }

    // Função para exibir o resultado codificado
    function exibirResultado(base64String) {
        let resultado = base64String;
        // Formata o resultado de acordo com o tipo de saída selecionado
        if (tipoSaida === "favicon") {
            resultado = `<link rel="icon" href="data:image/png;base64,${base64String}">`;
        } else if (tipoSaida === "imagem") {
            resultado = `<img src="data:image/png;base64,${base64String}" alt="Imagem">`;
        }
        // Define o valor do textarea com o resultado
        base64Resultado.value = resultado;
    }

    // Função para limpar os campos de entrada e resultado
    function limparCampos() {
        imagemInput.value = "";
        urlInput.value = "";
        base64Resultado.value = "";
        miniaturaImagem.style.display = "none";
        miniaturaImagem.src = "#";
    }

    // Função para copiar o texto do resultado para a área de transferência
    function copiarTexto() {
        base64Resultado.select();
        document.execCommand("copy");
        alert("Código copiado para a área de transferência!");
        limparCampos();
    }

    // Função para baixar o texto do resultado como um arquivo
    function baixarTexto() {
        const conteudo = base64Resultado.value;
        const elemento = document.createElement("a");
        elemento.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(conteudo));
        elemento.setAttribute("download", "codigo.txt");
        elemento.style.display = "none";
        document.body.appendChild(elemento);
        elemento.click();
        document.body.removeChild(elemento);
        limparCampos();
    }
});