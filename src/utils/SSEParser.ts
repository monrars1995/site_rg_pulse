// src/utils/SSEParser.ts

export type ParsedSSEEvent = {
    id?: string;
    event?: string;
    data: string; // O conteúdo JSON do campo data
    retry?: number;
  };
  
  export class SSEParser {
    private buffer = "";
    private onEvent: (event: ParsedSSEEvent) => void;
  
    constructor(onEventCallback: (event: ParsedSSEEvent) => void) {
      this.onEvent = onEventCallback;
    }
  
    // Adiciona novos dados (chunks) ao buffer
    public push(chunk: string): void {
      this.buffer += chunk;
      this.processBuffer();
    }
  
    // Processa o buffer para extrair eventos completos
    private processBuffer(): void {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const eventEndIndex = this.buffer.indexOf("\n\n");
        if (eventEndIndex < 0) {
          // Nenhum delimitador de fim de evento completo encontrado, espera mais dados.
          break;
        }
  
        // Extrai o bloco de evento completo (pode ter várias linhas)
        const eventBlock = this.buffer.substring(0, eventEndIndex);
        // Consome o bloco processado e o delimitador \n\n do buffer
        this.buffer = this.buffer.substring(eventEndIndex + "\n\n".length);
  
        // Processa as linhas dentro do bloco de evento
        const lines = eventBlock.split("\n");
        const currentEvent: Partial<ParsedSSEEvent> & { dataLines: string[] } = { dataLines: [] };
        
        for (const line of lines) {
          if (line.startsWith("data:")) {
            currentEvent.dataLines.push(line.substring(5).trim());
          } else if (line.startsWith("event:")) {
            currentEvent.event = line.substring(6).trim();
          } else if (line.startsWith("id:")) {
            currentEvent.id = line.substring(3).trim();
          } else if (line.startsWith("retry:")) {
            const retryValue = parseInt(line.substring(6).trim(), 10);
            if (!isNaN(retryValue)) {
              currentEvent.retry = retryValue;
            }
          } else if (line.startsWith(":")) {
            // Comentário, ignorar
          } else if (line.trim() !== "") {
            // console.warn("[SSEParser] Linha desconhecida no bloco SSE:", line);
          }
        }
  
        // Se dados foram acumulados (para A2A, esperamos que cada "data:" seja um JSON completo)
        if (currentEvent.dataLines.length > 0) {
          // A API A2A envia o JSON completo em uma única linha "data:",
          // então dataLines[0] deve ser o JSON.
          // Se a API pudesse enviar JSON multilinha através de múltiplos "data:",
          // você precisaria concatenar currentEvent.dataLines.join("").
          const jsonData = currentEvent.dataLines.join(""); // Para A2A, deve ser só dataLines[0]
          if (jsonData.trim()) {
              this.onEvent({
                  id: currentEvent.id,
                  event: currentEvent.event,
                  data: jsonData.trim(), // Passa a string JSON para ser parseada pelo consumidor
                  retry: currentEvent.retry,
              });
          }
        }
      } // Fim do while
    }
  
    // Chamado quando o stream de origem termina (reader.read() done: true)
    public finalize(): void {
      console.warn("[SSEParser] Finalizando, processando buffer residual inicial:", `"${this.buffer}"`);
      // Processa quaisquer eventos completos remanescentes no buffer que terminam com \n\n
      this.processBuffer();
  
      // Processa o restante do buffer linha por linha, caso não termine com \n\n
      // mas ainda contenha eventos 'data:' individuais.
      if (this.buffer.trim()) {
        const lines = this.buffer.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const jsonData = line.substring(5).trim();
            if (jsonData) {
              try {
                // Verifica se é um JSON válido antes de emitir
                JSON.parse(jsonData); 
                this.onEvent({
                  data: jsonData,
                  // id, event, retry podem não estar presentes em fragmentos
                });
              } catch (e) {
                console.warn("[SSEParser] Linha 'data:' residual inválida no finalize:", jsonData, e);
              }
            }
          } else if (line.trim() && !line.startsWith(":")) {
            // Linha não é 'data:' e não é comentário, pode ser parte de um evento malformado
            console.warn("[SSEParser] Linha residual não processada no finalize:", line);
          }
        }
      }
      this.buffer = ""; // Limpa o buffer
    }
  }