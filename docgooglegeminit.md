API Gemini Developer
Gerar uma chave da API Gemini
Receba uma chave da API Gemini e faça sua primeira solicitação de API em minutos.

Python
JavaScript
Go
Java
REST

from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Explain how AI works in a few words",
)

print(response.text)


import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await main();



Gemini API reference
A API Gemini permite acessar os modelos generativos mais recentes do Google. Esta referência de API fornece informações detalhadas sobre as classes e os métodos disponíveis nos SDKs da API Gemini. Escolha um idioma e siga as etapas de configuração para começar a criar.

Python JavaScript Go Apps Script

Instalar a biblioteca da API Gemini
Usando o Node.js v18 ou mais recente, instale o SDK da IA generativa do Google para TypeScript e JavaScript usando o seguinte comando npm:


npm install @google/genai
Faça sua primeira solicitação
Use o método generateContent para enviar uma solicitação à API Gemini.


import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();


Explicação sobre as versões da API

Este documento apresenta uma visão geral das diferenças entre as versões v1 e v1beta da API Gemini.

v1: versão estável da API. Os recursos na versão estável têm suporte total durante a vida útil da versão principal. Se houver mudanças importantes, a próxima versão principal da API será criada e a versão atual será descontinuada após um período razoável. Mudanças não críticas podem ser introduzidas na API sem alterar a versão principal.
v1beta: essa versão inclui recursos de acesso antecipado que podem estar em desenvolvimento e estão sujeitos a mudanças rápidas e interruptivas. Também não há garantia de que os recursos da versão Beta serão movidos para a versão estável. Devido a essa instabilidade, não lance aplicativos de produção com essa versão.
Recurso	v1	v1beta
Gerar conteúdo: entrada somente de texto		
Gerar conteúdo: entrada de texto e imagem		
Gerar conteúdo: saída de texto		
Gerar conteúdo: conversas com vários turnos (chat)		
Gerar conteúdo: chamadas de função		
Gerar conteúdo: streaming		
Incorporar conteúdo: entrada somente de texto		
Gerar resposta		
Recuperador semântico		
: compatível
: nunca vai ser compatível
Configurar a versão da API em um SDK
O SDK da API Gemini é padrão v1beta, mas você pode optar por usar outras versões definindo a versão da API, conforme mostrado no exemplo de código abaixo:


import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "YOUR_API_KEY",
  httpOptions: { apiVersion: "v1alpha" },
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works",
  });
  console.log(response.text);
}

await main();

Página inicial
Gemini API
Modelos
Referência da API
Isso foi útil?

Envie comentáriosModels


O endpoint de modelos oferece uma maneira de listar de maneira programática os modelos disponíveis e recuperar metadados estendidos, como a funcionalidade com suporte e o tamanho da janela de contexto. Leia mais no guia de modelos.

Método: models.get
Recebe informações sobre um Model específico, como o número da versão, os limites de token, os parâmetros e outros metadados. Consulte o guia de modelos do Gemini para informações detalhadas.

Endpoint
get
https://generativelanguage.googleapis.com/v1beta/{name=models/*}

Parâmetros de caminho
name
string
Obrigatório. O nome do recurso do modelo.

Esse nome precisa corresponder a um nome de modelo retornado pelo método models.list.

Formato: models/{model} Ele tem o formato models/{model}.

Corpo da solicitação
O corpo da solicitação precisa estar vazio.

Exemplo de solicitação
Python
Concha

from google import genai

client = genai.Client()
model_info = client.models.get(model="gemini-2.0-flash")
print(model_info)
Corpo da resposta
Se a solicitação for bem-sucedida, o corpo da resposta conterá uma instância de Model.

Método: models.list
Lista os Models disponíveis na API Gemini.

Endpoint
get
https://generativelanguage.googleapis.com/v1beta/models

Parâmetros de consulta
pageSize
integer
O número máximo de Models a serem retornados (por página).

Se não for especificado, 50 modelos serão retornados por página. Esse método retorna no máximo 1.000 modelos por página, mesmo que você transmita um pageSize maior.

pageToken
string
Um token de página recebido de uma chamada models.list anterior.

Forneça o pageToken retornado por uma solicitação como um argumento para a próxima solicitação para recuperar a próxima página.

Ao paginar, todos os outros parâmetros fornecidos para models.list precisam corresponder à chamada que forneceu o token da página.

Corpo da solicitação
O corpo da solicitação precisa estar vazio.

Exemplo de solicitação
Python
Concha

from google import genai

client = genai.Client()

print("List of models that support generateContent:\n")
for m in client.models.list():
    for action in m.supported_actions:
        if action == "generateContent":
            print(m.name)

print("List of models that support embedContent:\n")
for m in client.models.list():
    for action in m.supported_actions:
        if action == "embedContent":
            print(m.name)
Corpo da resposta
Resposta de ListModel contendo uma lista paginada de modelos.

Se bem-sucedido, o corpo da resposta incluirá dados com a estrutura a seguir:

Campos
models[]
object (Model)
Os modelos retornados.

nextPageToken
string
Um token, que pode ser enviado como pageToken para recuperar a próxima página.

Se esse campo for omitido, não haverá mais páginas.

Representação JSON

{
  "models": [
    {
      object (Model)
    }
  ],
  "nextPageToken": string
}
Recurso REST: models
Recurso: modelo
Informações sobre um modelo de linguagem generativa.

Campos
name
string
Obrigatório. O nome do recurso do Model. Consulte Variantes de modelo para conferir todos os valores permitidos.

Formato: models/{model} com uma convenção de nomenclatura {model} de:

"{baseModelId}-{version}"
Exemplos:

models/gemini-1.5-flash-001
baseModelId
string
Obrigatório. O nome do modelo de base, transmita isso à solicitação de geração.

Exemplos:

gemini-1.5-flash
version
string
Obrigatório. O número da versão do modelo.

Ele representa a versão principal (1.0 ou 1.5).

displayName
string
O nome legível do modelo. Por exemplo, "Gemini 1.5 Flash".

O nome pode ter até 128 caracteres e conter qualquer caractere UTF-8.

description
string
Uma breve descrição do modelo.

inputTokenLimit
integer
Número máximo de tokens de entrada permitidos para este modelo.

outputTokenLimit
integer
Número máximo de tokens de saída disponíveis para este modelo.

supportedGenerationMethods[]
string
Os métodos de geração aceitos pelo modelo.

Os nomes dos métodos da API correspondentes são definidos como strings em maiúsculas, como generateMessage e generateContent.

temperature
number
Controla a aleatoriedade da saída.

Os valores podem variar até [0.0,maxTemperature]. Um valor mais alto vai produzir respostas mais variadas, enquanto um valor mais próximo de 0.0 geralmente resulta em respostas menos surpreendentes do modelo. Esse valor especifica o padrão a ser usado pelo back-end ao fazer a chamada para o modelo.

maxTemperature
number
A temperatura máxima que esse modelo pode usar.

topP
number
Para amostragem de núcleo.

A amostragem de núcleo considera o menor conjunto de tokens com soma de probabilidade de pelo menos topP. Esse valor especifica o padrão a ser usado pelo back-end ao fazer a chamada para o modelo.

topK
integer
Para a amostragem top-k.

A amostragem Top-k considera o conjunto de tokens topK mais prováveis. Esse valor especifica o padrão a ser usado pelo back-end ao fazer a chamada para o modelo. Se estiver vazio, indica que o modelo não usa a amostragem top-k e que topK não é permitido como parâmetro de geração.

Representação JSON

{
  "name": string,
  "baseModelId": string,
  "version": string,
  "displayName": string,
  "description": string,
  "inputTokenLimit": integer,
  "outputTokenLimit": integer,
  "supportedGenerationMethods": [
    string
  ],
  "temperature": number,
  "maxTemperature": number,
  "topP": number,
  "topK": integer
}


Página inicial
Gemini API
Modelos
Referência da API
Isso foi útil?

Envie comentáriosGenerating content


A API Gemini oferece suporte à geração de conteúdo com imagens, áudio, código, ferramentas e muito mais. Para saber mais sobre cada um desses recursos, leia o código de exemplo focado em tarefas ou os guias completos.

Geração de texto
Vision
Áudio
Contexto longo
Execução de código
Modo JSON
Chamadas de função
Instruções do sistema
Método: models.generateContent
Gera uma resposta do modelo com base em uma entrada GenerateContentRequest. Consulte o guia de geração de texto para informações detalhadas sobre o uso. Os recursos de entrada variam entre os modelos, incluindo os modelos sintonizados. Consulte o guia do modelo e o guia de ajuste para mais detalhes.

Endpoint
post
https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent

Parâmetros de caminho
model
string
Obrigatório. O nome do Model a ser usado para gerar a conclusão.

Formato: models/{model}. Ele tem o formato models/{model}.

Corpo da solicitação
O corpo da solicitação contém dados com a seguinte estrutura:

Campos
contents[]
object (Content)
Obrigatório. O conteúdo da conversa atual com o modelo.

Para consultas de turno único, esta é uma instância única. Para consultas com várias interações, como chat, esse é um campo repetido que contém o histórico da conversa e a solicitação mais recente.

tools[]
object (Tool)
Opcional. Uma lista de Tools que a Model pode usar para gerar a próxima resposta.

Um Tool é um código que permite ao sistema interagir com sistemas externos para realizar uma ação ou conjunto de ações fora do conhecimento e do escopo do Model. Os Tools aceitos são Function e codeExecution. Consulte os guias Chamada de função e Execução de código para saber mais.

toolConfig
object (ToolConfig)
Opcional. Configuração da ferramenta para qualquer Tool especificado na solicitação. Consulte o guia de chamada de função para conferir um exemplo de uso.

safetySettings[]
object (SafetySetting)
Opcional. Uma lista de instâncias SafetySetting exclusivas para bloquear conteúdo não seguro.

Isso será aplicado em GenerateContentRequest.contents e GenerateContentResponse.candidates. Não pode haver mais de uma configuração para cada tipo de SafetyCategory. A API vai bloquear qualquer conteúdo e resposta que não atenda aos limites definidos por essas configurações. Essa lista substitui as configurações padrão de cada SafetyCategory especificado nas safetySettings. Se não houver SafetySetting para um determinado SafetyCategory fornecido na lista, a API vai usar a configuração de segurança padrão para essa categoria. As categorias de dano HARM_CATEGORY_HATE_SPEECH, HARM_CATEGORY_SEXUALLY_EXPLICIT, HARM_CATEGORY_DANGEROUS_CONTENT, HARM_CATEGORY_HARASSMENT e HARM_CATEGORY_CIVIC_INTEGRITY são compatíveis. Consulte o guia para informações detalhadas sobre as configurações de segurança disponíveis. Consulte também as orientações de segurança para saber como incorporar considerações de segurança nos seus aplicativos de IA.

systemInstruction
object (Content)
Opcional. O desenvolvedor definiu instruções do sistema. No momento, apenas texto.

generationConfig
object (GenerationConfig)
Opcional. Opções de configuração para geração de modelos e saídas.

cachedContent
string
Opcional. O nome do conteúdo armazenado em cache a ser usado como contexto para exibir a previsão. Formato: cachedContents/{cachedContent}

Exemplo de solicitação
Texto
Imagem
Áudio
Vídeo
PDF
Chat
Cache
Mais
Python
Node.js
Go
Concha
Kotlin
Swift
Dart
Java

// Make sure to include the following import:
// import {GoogleGenAI} from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Write a story about a magic backpack.",
});
console.log(response.text);
Corpo da resposta
Se a solicitação for bem-sucedida, o corpo da resposta conterá uma instância de GenerateContentResponse.

Método: models.streamGenerateContent
Gera uma resposta em streaming do modelo com base em uma entrada GenerateContentRequest.

Endpoint
post
https://generativelanguage.googleapis.com/v1beta/{model=models/*}:streamGenerateContent

Parâmetros de caminho
model
string
Obrigatório. O nome do Model a ser usado para gerar a conclusão.

Formato: models/{model}. Ele tem o formato models/{model}.

Corpo da solicitação
O corpo da solicitação contém dados com a seguinte estrutura:

Campos
contents[]
object (Content)
Obrigatório. O conteúdo da conversa atual com o modelo.

Para consultas de turno único, esta é uma instância única. Para consultas com várias interações, como chat, esse é um campo repetido que contém o histórico da conversa e a solicitação mais recente.

tools[]
object (Tool)
Opcional. Uma lista de Tools que a Model pode usar para gerar a próxima resposta.

Um Tool é um código que permite ao sistema interagir com sistemas externos para realizar uma ação ou conjunto de ações fora do conhecimento e do escopo do Model. Os Tools aceitos são Function e codeExecution. Consulte os guias Chamada de função e Execução de código para saber mais.

toolConfig
object (ToolConfig)
Opcional. Configuração da ferramenta para qualquer Tool especificado na solicitação. Consulte o guia de chamada de função para conferir um exemplo de uso.

safetySettings[]
object (SafetySetting)
Opcional. Uma lista de instâncias SafetySetting exclusivas para bloquear conteúdo não seguro.

Isso será aplicado em GenerateContentRequest.contents e GenerateContentResponse.candidates. Não pode haver mais de uma configuração para cada tipo de SafetyCategory. A API vai bloquear qualquer conteúdo e resposta que não atenda aos limites definidos por essas configurações. Essa lista substitui as configurações padrão de cada SafetyCategory especificado nas safetySettings. Se não houver SafetySetting para um determinado SafetyCategory fornecido na lista, a API vai usar a configuração de segurança padrão para essa categoria. As categorias de dano HARM_CATEGORY_HATE_SPEECH, HARM_CATEGORY_SEXUALLY_EXPLICIT, HARM_CATEGORY_DANGEROUS_CONTENT, HARM_CATEGORY_HARASSMENT e HARM_CATEGORY_CIVIC_INTEGRITY são compatíveis. Consulte o guia para informações detalhadas sobre as configurações de segurança disponíveis. Consulte também as orientações de segurança para saber como incorporar considerações de segurança nos seus aplicativos de IA.

systemInstruction
object (Content)
Opcional. O desenvolvedor definiu instruções do sistema. No momento, apenas texto.

generationConfig
object (GenerationConfig)
Opcional. Opções de configuração para geração de modelos e saídas.

cachedContent
string
Opcional. O nome do conteúdo armazenado em cache a ser usado como contexto para exibir a previsão. Formato: cachedContents/{cachedContent}

Exemplo de solicitação
Texto
Imagem
Áudio
Vídeo
PDF
Chat
Python
Node.js
Go
Concha
Kotlin
Swift
Dart
Java

// Make sure to include the following import:
// import {GoogleGenAI} from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContentStream({
  model: "gemini-2.0-flash",
  contents: "Write a story about a magic backpack.",
});
let text = "";
for await (const chunk of response) {
  console.log(chunk.text);
  text += chunk.text;
}
Corpo da resposta
Se a solicitação for bem-sucedida, o corpo da resposta vai conter um fluxo de instâncias de GenerateContentResponse.

GenerateContentResponse
Resposta do modelo que oferece várias respostas candidatas.

As classificações de segurança e a filtragem de conteúdo são informadas para a instrução em GenerateContentResponse.prompt_feedback e para cada candidato em finishReason e safetyRatings. A API: - Retorna todos os candidatos solicitados ou nenhum deles - Não retorna candidatos apenas se houver algo errado com a solicitação (confira promptFeedback) - Informa o feedback sobre cada candidato em finishReason e safetyRatings.

Campos
candidates[]
object (Candidate)
Respostas candidatas do modelo.

promptFeedback
object (PromptFeedback)
Retorna o feedback da instrução relacionada aos filtros de conteúdo.

usageMetadata
object (UsageMetadata)
Apenas saída. Metadados sobre o uso do token das solicitações de geração.

modelVersion
string
Apenas saída. A versão do modelo usada para gerar a resposta.

responseId
string
Somente saída. O responseId é usado para identificar cada resposta.

Representação JSON

{
  "candidates": [
    {
      object (Candidate)
    }
  ],
  "promptFeedback": {
    object (PromptFeedback)
  },
  "usageMetadata": {
    object (UsageMetadata)
  },
  "modelVersion": string,
  "responseId": string
}
PromptFeedback
Um conjunto de metadados de feedback que a solicitação especifica em GenerateContentRequest.content.

Campos
blockReason
enum (BlockReason)
Opcional. Se definido, o comando foi bloqueado e nenhum candidato é retornado. Reformule o comando.

safetyRatings[]
object (SafetyRating)
Classificações de segurança da instrução. Há no máximo uma classificação por categoria.

Representação JSON

{
  "blockReason": enum (BlockReason),
  "safetyRatings": [
    {
      object (SafetyRating)
    }
  ]
}
BlockReason
Especifica o motivo pelo qual a solicitação foi bloqueada.

Enums
BLOCK_REASON_UNSPECIFIED	Valor padrão. Esse valor não é usado.
SAFETY	O comando foi bloqueado por motivos de segurança. Inspecione safetyRatings para entender qual categoria de segurança bloqueou o conteúdo.
OTHER	O comando foi bloqueado por motivos desconhecidos.
BLOCKLIST	A solicitação foi bloqueada devido aos termos incluídos na lista de bloqueio de terminologia.
PROHIBITED_CONTENT	A solicitação foi bloqueada devido a conteúdo proibido.
IMAGE_SAFETY	Candidatos bloqueados devido a conteúdo não seguro de geração de imagens.
UsageMetadata
Metadados sobre o uso do token da solicitação de geração.

Campos
promptTokenCount
integer
Número de tokens no comando. Quando cachedContent é definido, ele ainda é o tamanho total do comando eficaz, o que significa que inclui o número de tokens no conteúdo armazenado em cache.

cachedContentTokenCount
integer
Número de tokens na parte armazenada em cache do comando (o conteúdo armazenado em cache)

candidatesTokenCount
integer
Número total de tokens em todos os candidatos de resposta gerados.

toolUsePromptTokenCount
integer
Apenas saída. Número de tokens presentes nas solicitações de uso da ferramenta.

thoughtsTokenCount
integer
Apenas saída. Número de tokens de pensamentos para modelos de pensamento.

totalTokenCount
integer
Contagem total de tokens para a solicitação de geração (comando + candidatos de resposta).

promptTokensDetails[]
object (ModalityTokenCount)
Apenas saída. Lista de modalidades processadas na entrada da solicitação.

cacheTokensDetails[]
object (ModalityTokenCount)
Apenas saída. Lista de modalidades do conteúdo em cache na entrada da solicitação.

candidatesTokensDetails[]
object (ModalityTokenCount)
Apenas saída. Lista de modalidades que foram retornadas na resposta.

toolUsePromptTokensDetails[]
object (ModalityTokenCount)
Apenas saída. Lista de modalidades processadas para entradas de solicitação de uso da ferramenta.

Representação JSON

{
  "promptTokenCount": integer,
  "cachedContentTokenCount": integer,
  "candidatesTokenCount": integer,
  "toolUsePromptTokenCount": integer,
  "thoughtsTokenCount": integer,
  "totalTokenCount": integer,
  "promptTokensDetails": [
    {
      object (ModalityTokenCount)
    }
  ],
  "cacheTokensDetails": [
    {
      object (ModalityTokenCount)
    }
  ],
  "candidatesTokensDetails": [
    {
      object (ModalityTokenCount)
    }
  ],
  "toolUsePromptTokensDetails": [
    {
      object (ModalityTokenCount)
    }
  ]
}
Candidato
Um candidato a resposta gerado pelo modelo.

Campos
content
object (Content)
Apenas saída. Conteúdo gerado retornado pelo modelo.

finishReason
enum (FinishReason)
Opcional. Apenas saída. É o motivo pelo qual o modelo parou de gerar tokens.

Se estiver vazio, o modelo não parou de gerar tokens.

safetyRatings[]
object (SafetyRating)
Lista de classificações para a segurança de um candidato a resposta.

Há no máximo uma classificação por categoria.

citationMetadata
object (CitationMetadata)
Apenas saída. Informações de citação do candidato gerado pelo modelo.

Esse campo pode ser preenchido com informações de recitação para qualquer texto incluído no content. São passagens "recitadas" de material protegido por direitos autorais nos dados de treinamento do LLM básico.

tokenCount
integer
Apenas saída. Contagem de tokens para esse candidato.

groundingAttributions[]
object (GroundingAttribution)
Apenas saída. Informações de atribuição das fontes que contribuíram para uma resposta fundamentada.

Esse campo é preenchido para chamadas GenerateAnswer.

groundingMetadata
object (GroundingMetadata)
Apenas saída. Metadados de fundamentação para o candidato.

Esse campo é preenchido para chamadas GenerateContent.

avgLogprobs
number
Apenas saída. Pontuação média da probabilidade de registro do candidato.

logprobsResult
object (LogprobsResult)
Apenas saída. Pontuações de probabilidade logarítmica para os tokens de resposta e os principais tokens

urlRetrievalMetadata
object (UrlRetrievalMetadata)
Apenas saída. Metadados relacionados à ferramenta de recuperação de contexto de URL.

urlContextMetadata
object (UrlContextMetadata)
Apenas saída. Metadados relacionados à ferramenta de recuperação de contexto de URL.

index
integer
Apenas saída. Índice do candidato na lista de candidatos de resposta.

Representação JSON

{
  "content": {
    object (Content)
  },
  "finishReason": enum (FinishReason),
  "safetyRatings": [
    {
      object (SafetyRating)
    }
  ],
  "citationMetadata": {
    object (CitationMetadata)
  },
  "tokenCount": integer,
  "groundingAttributions": [
    {
      object (GroundingAttribution)
    }
  ],
  "groundingMetadata": {
    object (GroundingMetadata)
  },
  "avgLogprobs": number,
  "logprobsResult": {
    object (LogprobsResult)
  },
  "urlRetrievalMetadata": {
    object (UrlRetrievalMetadata)
  },
  "urlContextMetadata": {
    object (UrlContextMetadata)
  },
  "index": integer
}
FinishReason
Define o motivo pelo qual o modelo parou de gerar tokens.

Enums
FINISH_REASON_UNSPECIFIED	Valor padrão. Esse valor não é usado.
STOP	Ponto de parada natural do modelo ou sequência de paradas fornecida.
MAX_TOKENS	O número máximo de tokens especificado na solicitação foi atingido.
SAFETY	O conteúdo do candidato a resposta foi sinalizado por motivos de segurança.
RECITATION	O conteúdo do candidato à resposta foi sinalizado por motivos de recitação.
LANGUAGE	O conteúdo da resposta do candidato foi sinalizado por usar um idioma não aceito.
OTHER	Motivo desconhecido.
BLOCKLIST	A geração de tokens foi interrompida porque o conteúdo contém termos proibidos.
PROHIBITED_CONTENT	A geração de tokens foi interrompida por conter conteúdo proibido.
SPII	A geração de tokens foi interrompida porque o conteúdo pode conter informações sensíveis de identificação pessoal (SPII).
MALFORMED_FUNCTION_CALL	A chamada de função gerada pelo modelo é inválida.
IMAGE_SAFETY	A geração de tokens foi interrompida porque as imagens geradas contêm violações de segurança.
GroundingAttribution
Atribuição de uma fonte que contribuiu para uma resposta.

Campos
sourceId
object (AttributionSourceId)
Apenas saída. Identificador da origem que contribui para essa atribuição.

content
object (Content)
Conteúdo de origem que compõe essa atribuição.

Representação JSON

{
  "sourceId": {
    object (AttributionSourceId)
  },
  "content": {
    object (Content)
  }
}
AttributionSourceId
Identificador da origem que contribui para essa atribuição.

Campos
source
Union type
source pode ser apenas de um dos tipos a seguir:
groundingPassage
object (GroundingPassageId)
Identificador de uma passagem inline.

semanticRetrieverChunk
object (SemanticRetrieverChunk)
Identificador de um Chunk buscado pelo Semantic Retriever.

Representação JSON

{

  // source
  "groundingPassage": {
    object (GroundingPassageId)
  },
  "semanticRetrieverChunk": {
    object (SemanticRetrieverChunk)
  }
  // Union type
}
GroundingPassageId
Identificador de uma parte em uma GroundingPassage.

Campos
passageId
string
Apenas saída. ID da passagem que corresponde ao GroundingPassage.id do GenerateAnswerRequest.

partIndex
integer
Apenas saída. Índice da parte no GroundingPassage.content do GenerateAnswerRequest.

Representação JSON

{
  "passageId": string,
  "partIndex": integer
}
SemanticRetrieverChunk
Identificador de um Chunk recuperado pelo recuperador semântico especificado no GenerateAnswerRequest usando SemanticRetrieverConfig.

Campos
source
string
Apenas saída. Nome da origem que corresponde ao SemanticRetrieverConfig.source da solicitação. Exemplo: corpora/123 ou corpora/123/documents/abc

chunk
string
Apenas saída. Nome do Chunk que contém o texto atribuído. Exemplo: corpora/123/documents/abc/chunks/xyz

Representação JSON

{
  "source": string,
  "chunk": string
}
GroundingMetadata
Metadados retornados ao cliente quando a conexão à terra está ativada.

Campos
groundingChunks[]
object (GroundingChunk)
Lista de referências de apoio extraídas da fonte de fundamentação especificada.

groundingSupports[]
object (GroundingSupport)
Lista de suporte de aterramento.

webSearchQueries[]
string
Consultas de pesquisa na Web para a pesquisa na Web seguinte.

searchEntryPoint
object (SearchEntryPoint)
Opcional. Entrada da Pesquisa Google para as pesquisas na Web seguintes.

retrievalMetadata
object (RetrievalMetadata)
Metadados relacionados à recuperação no fluxo de fundamentação.

Representação JSON

{
  "groundingChunks": [
    {
      object (GroundingChunk)
    }
  ],
  "groundingSupports": [
    {
      object (GroundingSupport)
    }
  ],
  "webSearchQueries": [
    string
  ],
  "searchEntryPoint": {
    object (SearchEntryPoint)
  },
  "retrievalMetadata": {
    object (RetrievalMetadata)
  }
}
SearchEntryPoint
Ponto de entrada da Pesquisa Google.

Campos
renderedContent
string
Opcional. Snippet de conteúdo da Web que pode ser incorporado a uma página da Web ou a uma WebView de app.

sdkBlob
string (bytes format)
Opcional. JSON codificado em base64 que representa uma matriz de tupla <termo de pesquisa, URL de pesquisa>.

Uma string codificada em base64.

Representação JSON

{
  "renderedContent": string,
  "sdkBlob": string
}
GroundingChunk
Chunk de embasamento.

Campos
chunk_type
Union type
Tipo de bloco. chunk_type pode ser apenas de um dos tipos a seguir:
web
object (Web)
Chunk de aterramento da Web.

Representação JSON

{

  // chunk_type
  "web": {
    object (Web)
  }
  // Union type
}
Web
Parte da Web.

Campos
uri
string
Referência do URI do bloco.

title
string
Título do bloco.

Representação JSON

{
  "uri": string,
  "title": string
}
GroundingSupport
Suporte de embasamento.

Campos
groundingChunkIndices[]
integer
Uma lista de índices (em "grounding_chunk") que especifica as citações associadas à reivindicação. Por exemplo, [1,3,4] significa que grounding_chunk[1], grounding_chunk[3], grounding_chunk[4] são o conteúdo recuperado atribuído à declaração.

confidenceScores[]
number
Pontuação de confiança das referências de suporte. Varia de 0 a 1. 1 é o mais confiante. Essa lista precisa ter o mesmo tamanho que groundingChunkIndices.

segment
object (Segment)
Segmento do conteúdo a que o suporte pertence.

Representação JSON

{
  "groundingChunkIndices": [
    integer
  ],
  "confidenceScores": [
    number
  ],
  "segment": {
    object (Segment)
  }
}
Segmento
Segmento do conteúdo.

Campos
partIndex
integer
Apenas saída. O índice de um objeto "Part" dentro do objeto pai "Content".

startIndex
integer
Apenas saída. Comece o índice na parte especificada, medido em bytes. Deslocamento a partir do início da parte, inclusive, começando em zero.

endIndex
integer
Apenas saída. Índice final na parte especificada, medido em bytes. Deslocamento da parte a partir do início, exclusivo, começando em zero.

text
string
Apenas saída. O texto correspondente ao segmento da resposta.

Representação JSON

{
  "partIndex": integer,
  "startIndex": integer,
  "endIndex": integer,
  "text": string
}
RetrievalMetadata
Metadados relacionados à recuperação no fluxo de fundamentação.

Campos
googleSearchDynamicRetrievalScore
number
Opcional. Pontuação que indica a probabilidade de as informações da Pesquisa Google ajudarem a responder à instrução. A pontuação está no intervalo [0, 1], em que 0 é o menos provável e 1 é o mais provável. Essa pontuação só é preenchida quando a integração com a Pesquisa Google e a recuperação dinâmica estão ativadas. Ele será comparado ao limite para determinar se a pesquisa do Google será acionada.

Representação JSON

{
  "googleSearchDynamicRetrievalScore": number
}
LogprobsResult
Resultado de Logprobs

Campos
topCandidates[]
object (TopCandidates)
Comprimento = número total de etapas de decodificação.

chosenCandidates[]
object (Candidate)
Comprimento = número total de etapas de decodificação. Os candidatos escolhidos podem ou não estar em topCandidates.

Representação JSON

{
  "topCandidates": [
    {
      object (TopCandidates)
    }
  ],
  "chosenCandidates": [
    {
      object (Candidate)
    }
  ]
}
TopCandidates
Candidatos com as maiores probabilidades de registro em cada etapa de decodificação.

Campos
candidates[]
object (Candidate)
Classificados por probabilidade logarítmica em ordem decrescente.

Representação JSON

{
  "candidates": [
    {
      object (Candidate)
    }
  ]
}
Candidato
Candidato para o token e a pontuação do logprobs.

Campos
token
string
O valor da string do token do candidato.

tokenId
integer
O valor do ID do token do candidato.

logProbability
number
A probabilidade de registro do candidato.

Representação JSON

{
  "token": string,
  "tokenId": integer,
  "logProbability": number
}
UrlRetrievalMetadata
Metadados relacionados à ferramenta de recuperação de contexto de URL.

Campos
urlRetrievalContexts[]
object (UrlRetrievalContext)
Lista de contextos de recuperação de URL.

Representação JSON

{
  "urlRetrievalContexts": [
    {
      object (UrlRetrievalContext)
    }
  ]
}
UrlRetrievalContext
Contexto da recuperação de um único URL.

Campos
retrievedUrl
string
URL recuperado pela ferramenta.

Representação JSON

{
  "retrievedUrl": string
}
UrlContextMetadata
Metadados relacionados à ferramenta de recuperação de contexto de URL.

Campos
urlMetadata[]
object (UrlMetadata)
Lista de contextos de URL.

Representação JSON

{
  "urlMetadata": [
    {
      object (UrlMetadata)
    }
  ]
}
UrlMetadata
Contexto da recuperação de um único URL.

Campos
retrievedUrl
string
URL recuperado pela ferramenta.

urlRetrievalStatus
enum (UrlRetrievalStatus)
Status da recuperação do URL.

Representação JSON

{
  "retrievedUrl": string,
  "urlRetrievalStatus": enum (UrlRetrievalStatus)
}
UrlRetrievalStatus
Status da recuperação do URL.

Enums
URL_RETRIEVAL_STATUS_UNSPECIFIED	Valor padrão. Esse valor não é usado.
URL_RETRIEVAL_STATUS_SUCCESS	A recuperação de URL foi concluída.
URL_RETRIEVAL_STATUS_ERROR	A recuperação de URL falhou devido a um erro.
CitationMetadata
Uma coleção de atribuições de origem para um conteúdo.

Campos
citationSources[]
object (CitationSource)
Citações de fontes para uma resposta específica.

Representação JSON

{
  "citationSources": [
    {
      object (CitationSource)
    }
  ]
}
CitationSource
Uma citação de uma fonte para uma parte de uma resposta específica.

Campos
startIndex
integer
Opcional. Início do segmento da resposta atribuída a essa origem.

O índice indica o início do segmento, medido em bytes.

endIndex
integer
Opcional. Fim do segmento atribuído, exclusivo.

uri
string
Opcional. URI atribuído como origem de uma parte do texto.

license
string
Opcional. Licença do projeto do GitHub atribuído como origem do segmento.

As informações da licença são necessárias para citações de código.

Representação JSON

{
  "startIndex": integer,
  "endIndex": integer,
  "uri": string,
  "license": string
}
GenerationConfig
Opções de configuração para geração de modelos e saídas. Nem todos os parâmetros são configuráveis para todos os modelos.

Campos
stopSequences[]
string
Opcional. O conjunto de sequências de caracteres (até 5) que vai interromper a geração de saída. Se especificado, a API vai parar na primeira aparição de um stop_sequence. A sequência de paradas não será incluída como parte da resposta.

responseMimeType
string
Opcional. Tipo MIME do texto candidato gerado. Os tipos MIME aceitos são: text/plain: (padrão) Saída de texto. application/json: resposta JSON nos candidatos. text/x.enum: ENUM como uma resposta de string nos candidatos de resposta. Consulte os documentos para conferir uma lista de todos os tipos MIME de texto aceitos.

responseSchema
object (Schema)
Opcional. Esquema de saída do texto candidato gerado. Os esquemas precisam ser um subconjunto do esquema da OpenAPI e podem ser objetos, primitivos ou matrizes.

Se definido, um responseMimeType compatível também precisa ser definido. Tipos MIME compatíveis: application/json: esquema para resposta JSON. Consulte o guia de geração de texto JSON para mais detalhes.

responseModalities[]
enum (Modality)
Opcional. As modalidades de resposta solicitadas. Representa o conjunto de modalidades que o modelo pode retornar e que devem ser esperadas na resposta. Essa é uma correspondência exata com as modalidades da resposta.

Um modelo pode ter várias combinações de modalidades compatíveis. Se as modalidades solicitadas não corresponderem a nenhuma das combinações compatíveis, um erro será retornado.

Uma lista vazia é equivalente a solicitar apenas texto.

candidateCount
integer
Opcional. Número de respostas geradas a serem retornadas. Se não for definido, o padrão será 1. Isso não funciona para modelos de geração anterior (família Gemini 1.0).

maxOutputTokens
integer
Opcional. O número máximo de tokens a serem incluídos em um candidato de resposta.

Observação: o valor padrão varia de acordo com o modelo. Consulte o atributo Model.output_token_limit do Model retornado pela função getModel.

temperature
number
Opcional. Controla a aleatoriedade da saída.

Observação: o valor padrão varia de acordo com o modelo. Consulte o atributo Model.temperature do Model retornado pela função getModel.

Os valores podem variar de [0,0 a 2,0].

topP
number
Opcional. A probabilidade cumulativa máxima de tokens a serem considerados na amostragem.

O modelo usa a amostragem top-k e top-p (núcleo) combinada.

Os tokens são classificados com base nas probabilidades atribuídas, de modo que apenas os mais prováveis são considerados. A amostragem Top-k limita diretamente o número máximo de tokens a serem considerados, enquanto a amostragem Nucleus limita o número de tokens com base na probabilidade cumulativa.

Observação: o valor padrão varia de acordo com Model e é especificado pelo atributo Model.top_p retornado pela função getModel. Um atributo topK vazio indica que o modelo não aplica a amostragem top-k e não permite a configuração de topK nas solicitações.

topK
integer
Opcional. O número máximo de tokens a considerar na amostragem.

Os modelos do Gemini usam a amostragem top-p (núcleo) ou uma combinação da amostragem top-k e da amostragem de núcleo. A amostragem Top-k considera o conjunto de tokens topK mais prováveis. Os modelos executados com a amostragem de núcleo não permitem a configuração de topK.

Observação: o valor padrão varia de acordo com Model e é especificado pelo atributo Model.top_p retornado pela função getModel. Um atributo topK vazio indica que o modelo não aplica a amostragem top-k e não permite a configuração de topK nas solicitações.

seed
integer
Opcional. Seed usada na decodificação. Se não for definido, a solicitação vai usar uma seed gerada aleatoriamente.

presencePenalty
number
Opcional. Penalidade de presença aplicada aos logprobs do próximo token se ele já tiver sido identificado na resposta.

Essa penalidade é binária (ativada/desativada) e não depende do número de vezes que o token é usado (após o primeiro). Use frequencyPenalty para uma penalidade que aumenta a cada uso.

Uma penalidade positiva desencoraja o uso de tokens que já foram usados na resposta, aumentando o vocabulário.

Uma penalidade negativa incentiva o uso de tokens que já foram usados na resposta, diminuindo o vocabulário.

frequencyPenalty
number
Opcional. Penalização de frequência aplicada aos logprobs do próximo token, multiplicado pelo número de vezes que cada token foi encontrado na resposta até o momento.

Uma penalidade positiva vai desencorajar o uso de tokens que já foram usados, proporcional ao número de vezes que o token foi usado: quanto mais um token é usado, mais difícil é para o modelo usá-lo novamente, aumentando o vocabulário das respostas.

Cuidado: uma penalidade negativa incentiva o modelo a reutilizar tokens de forma proporcional ao número de vezes que o token foi usado. Valores negativos pequenos reduzem o vocabulário de uma resposta. Valores negativos maiores farão com que o modelo comece a repetir um token comum até atingir o limite de maxOutputTokens.

responseLogprobs
boolean
Opcional. Se verdadeiro, exporte os resultados de logprobs em resposta.

logprobs
integer
Opcional. Válido apenas se responseLogprobs=True. Isso define o número de logprobs principais a serem retornados em cada etapa de decodificação no Candidate.logprobs_result.

enableEnhancedCivicAnswers
boolean
Opcional. Ativa respostas cívicas aprimoradas. Ele pode não estar disponível para todos os modelos.

speechConfig
object (SpeechConfig)
Opcional. A configuração de geração de voz.

thinkingConfig
object (ThinkingConfig)
Opcional. Config para pensar em recursos. Um erro será retornado se esse campo for definido para modelos que não oferecem suporte ao pensamento.

mediaResolution
enum (MediaResolution)
Opcional. Se especificado, a resolução de mídia especificada será usada.

Representação JSON

{
  "stopSequences": [
    string
  ],
  "responseMimeType": string,
  "responseSchema": {
    object (Schema)
  },
  "responseModalities": [
    enum (Modality)
  ],
  "candidateCount": integer,
  "maxOutputTokens": integer,
  "temperature": number,
  "topP": number,
  "topK": integer,
  "seed": integer,
  "presencePenalty": number,
  "frequencyPenalty": number,
  "responseLogprobs": boolean,
  "logprobs": integer,
  "enableEnhancedCivicAnswers": boolean,
  "speechConfig": {
    object (SpeechConfig)
  },
  "thinkingConfig": {
    object (ThinkingConfig)
  },
  "mediaResolution": enum (MediaResolution)
}
Modalidade
Modalidades de resposta compatíveis.

Enums
MODALITY_UNSPECIFIED	Valor padrão.
TEXT	Indica que o modelo precisa retornar texto.
IMAGE	Indica que o modelo precisa retornar imagens.
AUDIO	Indica que o modelo precisa retornar áudio.
SpeechConfig
A configuração de geração de voz.

Campos
voiceConfig
object (VoiceConfig)
A configuração em caso de saída de voz única.

multiSpeakerVoiceConfig
object (MultiSpeakerVoiceConfig)
Opcional. A configuração para vários alto-falantes. Ele é mutuamente exclusivo com o campo voiceConfig.

languageCode
string
Opcional. Código do idioma (no formato BCP 47, por exemplo, "en-US") para síntese de voz.

Os valores válidos são: de-DE, en-AU, en-GB, en-IN, en-US, es-US, fr-FR, hi-IN, pt-BR, ar-XA, es-ES, fr-CA, id-ID, it-IT, ja-JP, tr-TR, vi-VN, bn-IN, gu-IN, kn-IN, ml-IN, mr-IN, ta-IN, te-IN, nl-NL, ko-KR, cmn-CN, pl-PL, ru-RU e th-TH.

Representação JSON

{
  "voiceConfig": {
    object (VoiceConfig)
  },
  "multiSpeakerVoiceConfig": {
    object (MultiSpeakerVoiceConfig)
  },
  "languageCode": string
}
VoiceConfig
A configuração da voz a ser usada.

Campos
voice_config
Union type
A configuração que o alto-falante vai usar. voice_config pode ser apenas de um dos tipos a seguir:
prebuiltVoiceConfig
object (PrebuiltVoiceConfig)
A configuração da voz pré-criada a ser usada.

Representação JSON

{

  // voice_config
  "prebuiltVoiceConfig": {
    object (PrebuiltVoiceConfig)
  }
  // Union type
}
PrebuiltVoiceConfig
A configuração que o alto-falante pré-criado vai usar.

Campos
voiceName
string
O nome da voz predefinida a ser usada.

Representação JSON

{
  "voiceName": string
}
MultiSpeakerVoiceConfig
A configuração para vários alto-falantes.

Campos
speakerVoiceConfigs[]
object (SpeakerVoiceConfig)
Obrigatório. Todas as vozes do alto-falante ativadas.

Representação JSON

{
  "speakerVoiceConfigs": [
    {
      object (SpeakerVoiceConfig)
    }
  ]
}
SpeakerVoiceConfig
A configuração de um único alto-falante em uma configuração de vários alto-falantes.

Campos
speaker
string
Obrigatório. O nome do alto-falante a ser usado. Precisa ser o mesmo que no comando.

voiceConfig
object (VoiceConfig)
Obrigatório. A configuração da voz a ser usada.

Representação JSON

{
  "speaker": string,
  "voiceConfig": {
    object (VoiceConfig)
  }
}
ThinkingConfig
Config para pensar em recursos.

Campos
includeThoughts
boolean
Indica se é preciso incluir pensamentos na resposta. Se verdadeiro, os pensamentos são retornados somente quando disponíveis.

thinkingBudget
integer
O número de tokens de pensamentos que o modelo precisa gerar.

Representação JSON

{
  "includeThoughts": boolean,
  "thinkingBudget": integer
}
MediaResolution
Resolução da mídia de entrada.

Enums
MEDIA_RESOLUTION_UNSPECIFIED	A resolução da mídia não foi definida.
MEDIA_RESOLUTION_LOW	A resolução da mídia está definida como baixa (64 tokens).
MEDIA_RESOLUTION_MEDIUM	Resolução de mídia definida como média (256 tokens).
MEDIA_RESOLUTION_HIGH	A resolução da mídia está definida como alta (reenquadramento com zoom e 256 tokens).
HarmCategory
A categoria de uma nota.

Essas categorias abrangem vários tipos de danos que os desenvolvedores podem querer ajustar.

Enums
HARM_CATEGORY_UNSPECIFIED	A categoria não foi especificada.
HARM_CATEGORY_DEROGATORY	PaLM: comentários negativos ou nocivos voltados à identidade e/ou atributos protegidos.
HARM_CATEGORY_TOXICITY	PaLM: conteúdo grosseiro, desrespeitoso ou com linguagem obscena.
HARM_CATEGORY_VIOLENCE	PaLM: descreve cenários que retratam violência contra um indivíduo ou grupo ou descrições gerais de sangue em excesso.
HARM_CATEGORY_SEXUAL	PaLM: contém referências a atos sexuais ou outro conteúdo obsceno.
HARM_CATEGORY_MEDICAL	PaLM: promove orientações médicas não verificadas.
HARM_CATEGORY_DANGEROUS	PaLM: conteúdo perigoso que promove, facilita ou incentiva atos nocivos.
HARM_CATEGORY_HARASSMENT	Gemini: conteúdo de assédio.
HARM_CATEGORY_HATE_SPEECH	Gemini: discurso e conteúdo de ódio.
HARM_CATEGORY_SEXUALLY_EXPLICIT	Gemini: conteúdo sexualmente explícito.
HARM_CATEGORY_DANGEROUS_CONTENT	Gemini: conteúdo perigoso.
HARM_CATEGORY_CIVIC_INTEGRITY	Gemini: conteúdo que pode ser usado para prejudicar a integridade cívica.
ModalityTokenCount
Representa informações de contagem de tokens para uma única modalidade.

Campos
modality
enum (Modality)
A modalidade associada a essa contagem de tokens.

tokenCount
integer
Número de tokens.

Representação JSON

{
  "modality": enum (Modality),
  "tokenCount": integer
}
Modalidade
Modalidade da parte do conteúdo

Enums
MODALITY_UNSPECIFIED	Modalidade não especificada.
TEXT	Texto simples.
IMAGE	Imagem.
VIDEO	Vídeo.
AUDIO	Áudio.
DOCUMENT	Documento, por exemplo, PDF.
SafetyRating
Classificação de segurança de um conteúdo.

A classificação de segurança contém a categoria de dano e o nível de probabilidade de dano nessa categoria para um conteúdo. O conteúdo é classificado para segurança em várias categorias de danos, e a probabilidade da classificação de dano é incluída aqui.

Campos
category
enum (HarmCategory)
Obrigatório. A categoria da nota.

probability
enum (HarmProbability)
Obrigatório. A probabilidade de danos desse conteúdo.

blocked
boolean
Esse conteúdo foi bloqueado por causa dessa classificação?

Representação JSON

{
  "category": enum (HarmCategory),
  "probability": enum (HarmProbability),
  "blocked": boolean
}
HarmProbability
A probabilidade de um conteúdo ser nocivo.

O sistema de classificação indica a probabilidade de o conteúdo não ser seguro. Isso não indica a gravidade do dano de um conteúdo.

Enums
HARM_PROBABILITY_UNSPECIFIED	A probabilidade não foi especificada.
NEGLIGIBLE	O conteúdo tem uma chance mínima de não ser seguro.
LOW	O conteúdo tem uma probabilidade baixa de não ser seguro.
MEDIUM	O conteúdo tem uma chance média de não ser seguro.
HIGH	O conteúdo tem uma grande chance de não ser seguro.
SafetySetting
Configuração de segurança, que afeta o comportamento de bloqueio de segurança.

A transmissão de uma configuração de segurança para uma categoria muda a probabilidade permitida de que o conteúdo seja bloqueado.

Campos
category
enum (HarmCategory)
Obrigatório. A categoria dessa configuração.

threshold
enum (HarmBlockThreshold)
Obrigatório. Controla o limite de probabilidade em que o dano é bloqueado.

Representação JSON

{
  "category": enum (HarmCategory),
  "threshold": enum (HarmBlockThreshold)
}
HarmBlockThreshold
Bloquear em uma probabilidade de dano especificada ou maior.

Enums
HARM_BLOCK_THRESHOLD_UNSPECIFIED	O limite não foi especificado.
BLOCK_LOW_AND_ABOVE	Conteúdo com NEGLIGIBLE será permitido.
BLOCK_MEDIUM_AND_ABOVE	Conteúdo com NEGLIGIBLE e LOW será permitido.
BLOCK_ONLY_HIGH	Conteúdo com NEGLIGIBLE, LOW e MEDIUM será permitido.
BLOCK_NONE	Todo o conteúdo será permitido.
OFF	Desative o filtro de segurança.
Página inicial
Gemini API
Modelos
Referência da API
Isso foi útil?

Envie comentáriosEmbeddings


As embeddings são uma representação numérica da entrada de texto que abrem vários casos de uso exclusivos, como agrupamento, medição de similaridade e recuperação de informações. Para uma introdução, consulte o guia de incorporação.

Método: models.embedContent
Gera um vetor de embedding de texto a partir da entrada Content usando o modelo de embedding do Gemini especificado.

Endpoint
post
https://generativelanguage.googleapis.com/v1beta/{model=models/*}:embedContent

Parâmetros de caminho
model
string
Obrigatório. O nome do recurso do modelo. Ele serve como um ID para o modelo usar.

Esse nome precisa corresponder a um nome de modelo retornado pelo método models.list.

Formato: models/{model} Ele tem o formato models/{model}.

Corpo da solicitação
O corpo da solicitação contém dados com a seguinte estrutura:

Campos
content
object (Content)
Obrigatório. O conteúdo a ser incorporado. Somente os campos parts.text serão contados.

taskType
enum (TaskType)
Opcional. Tipo de tarefa opcional em que os embeddings serão usados. Não é compatível com modelos anteriores (models/embedding-001).

title
string
Opcional. Um título opcional para o texto. Aplicável somente quando o TaskType é RETRIEVAL_DOCUMENT.

Observação: especificar um title para RETRIEVAL_DOCUMENT oferece embeddings de melhor qualidade para recuperação.

outputDimensionality
integer
Opcional. Dimensão reduzida opcional para a incorporação de saída. Se definido, valores excessivos na incorporação de saída serão truncados a partir do final. Compatível apenas com modelos mais recentes desde 2024. Não é possível definir esse valor se você estiver usando o modelo anterior (models/embedding-001).

Exemplo de solicitação
Python
Node.js
Concha

// Make sure to include the following import:
// import {GoogleGenAI} from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const text = "Hello World!";
const result = await ai.models.embedContent({
  model: "text-embedding-004",
  contents: text,
  config: { outputDimensionality: 10 },
});
console.log(result.embeddings);
Corpo da resposta
A resposta a uma EmbedContentRequest.

Se bem-sucedido, o corpo da resposta incluirá dados com a estrutura a seguir:

Campos
embedding
object (ContentEmbedding)
Apenas saída. A incorporação gerada pelo conteúdo de entrada.

Representação JSON

{
  "embedding": {
    object (ContentEmbedding)
  }
}
Método: models.batchEmbedContents
Gera vários vetores de embedding da entrada Content, que consiste em um lote de strings representadas como objetos EmbedContentRequest.

Endpoint
post
https://generativelanguage.googleapis.com/v1beta/{model=models/*}:batchEmbedContents

Parâmetros de caminho
model
string
Obrigatório. O nome do recurso do modelo. Ele serve como um ID para o modelo usar.

Esse nome precisa corresponder a um nome de modelo retornado pelo método models.list.

Formato: models/{model} Ele tem o formato models/{model}.

Corpo da solicitação
O corpo da solicitação contém dados com a seguinte estrutura:

Campos
requests[]
object (EmbedContentRequest)
Obrigatório. Insira solicitações para o lote. O modelo em cada uma dessas solicitações precisa corresponder ao modelo especificado BatchEmbedContentsRequest.model.

Exemplo de solicitação
Python
Node.js
Concha

// Make sure to include the following import:
// import {GoogleGenAI} from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const texts = [
  "What is the meaning of life?",
  "How much wood would a woodchuck chuck?",
  "How does the brain work?",
];
const result = await ai.models.embedContent({
  model: "text-embedding-004",
  contents: texts,
  config: { outputDimensionality: 10 },
});
console.log(result.embeddings);
Corpo da resposta
A resposta para uma BatchEmbedContentsRequest.

Se bem-sucedido, o corpo da resposta incluirá dados com a estrutura a seguir:

Campos
embeddings[]
object (ContentEmbedding)
Apenas saída. As incorporações de cada solicitação, na mesma ordem fornecida na solicitação em lote.

Representação JSON

{
  "embeddings": [
    {
      object (ContentEmbedding)
    }
  ]
}
EmbedContentRequest
Solicitação que contém o Content para a incorporação do modelo.

Campos
model
string
Obrigatório. O nome do recurso do modelo. Ele serve como um ID para o modelo usar.

Esse nome precisa corresponder a um nome de modelo retornado pelo método models.list.

Formato: models/{model}

content
object (Content)
Obrigatório. O conteúdo a ser incorporado. Somente os campos parts.text serão contados.

taskType
enum (TaskType)
Opcional. Tipo de tarefa opcional em que os embeddings serão usados. Não é compatível com modelos anteriores (models/embedding-001).

title
string
Opcional. Um título opcional para o texto. Aplicável somente quando o TaskType é RETRIEVAL_DOCUMENT.

Observação: especificar um title para RETRIEVAL_DOCUMENT oferece embeddings de melhor qualidade para recuperação.

outputDimensionality
integer
Opcional. Dimensão reduzida opcional para a incorporação de saída. Se definido, valores excessivos na incorporação de saída serão truncados a partir do final. Compatível apenas com modelos mais recentes desde 2024. Não é possível definir esse valor se você estiver usando o modelo anterior (models/embedding-001).

Representação JSON

{
  "model": string,
  "content": {
    object (Content)
  },
  "taskType": enum (TaskType),
  "title": string,
  "outputDimensionality": integer
}
ContentEmbedding
Uma lista de pontos flutuantes que representam uma incorporação.

Campos
values[]
number
Os valores de embedding.

Representação JSON

{
  "values": [
    number
  ]
}
TaskType
Tipo de tarefa para a qual o embedding será usado.

Enums
TASK_TYPE_UNSPECIFIED	Valor não definido, que vai ser padrão para um dos outros valores do tipo enumerado.
RETRIEVAL_QUERY	Especifica que o texto é uma consulta em uma configuração de pesquisa/recuperação.
RETRIEVAL_DOCUMENT	Especifica que o texto é um documento do corpus pesquisado.
SEMANTIC_SIMILARITY	Especifica que o texto fornecido será usado para STS.
CLASSIFICATION	Especifica que o texto será classificado.
CLUSTERING	Especifica que os embeddings serão usados para clustering.
QUESTION_ANSWERING	Especifica que o texto fornecido será usado para responder a perguntas.
FACT_VERIFICATION	Especifica que o texto fornecido será usado para a verificação de fatos.
CODE_RETRIEVAL_QUERY	Especifica que o texto fornecido será usado para recuperar o código.