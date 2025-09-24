Geração de imagens

É possível gerar imagens usando a API Gemini com os recursos multimodais integrados do Gemini ou o Imagen, o modelo de geração de imagens especializado do Google. Na maioria dos casos de uso, comece com o Gemini. Escolha o Imagen para tarefas especializadas em que a qualidade da imagem é fundamental. Consulte a seção Como escolher o modelo certo para mais orientações.

Todas as imagens geradas incluem uma marca-d'água SynthID.

Antes de começar
Use um modelo e uma versão com suporte para a geração de imagens:

Para o Gemini, use a geração de imagem de visualização do Gemini 2.0 Flash.

Para Imagen, use Imagen 3. Esse modelo está disponível apenas no nível pago.

Você pode acessar o Gemini e o Imagen 3 usando as mesmas bibliotecas.

Observação: a geração de imagens pode não estar disponível em todas as regiões e países. Confira nossa página Modelos para mais informações.
Gerar imagens usando o Gemini
O Gemini pode gerar e processar imagens em conversas. Você pode pedir ao Gemini para usar texto, imagens ou uma combinação de ambos para realizar várias tarefas relacionadas a imagens, como geração e edição.

Inclua responseModalities: ["TEXT", "IMAGE"] na sua configuração. Esses modelos não oferecem suporte para saídas somente de imagem.

Geração de imagens (texto para imagem)
O código abaixo demonstra como gerar uma imagem com base em uma solicitação descritiva:

Python
JavaScript
Go
REST
Observação: lançamos o SDK do Google para TypeScript e JavaScript no estágio de lançamento da versão prévia. Use este SDK para recursos de geração de imagens.

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

  const contents =
    "Hi, can you create a 3d rendered image of a pig " +
    "with wings and a top hat flying over a happy " +
    "futuristic scifi city with lots of greenery?";

  // Set responseModalities to include "Image" so the model can generate  an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });
  for (const part of response.candidates[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }
}

main();
Imagem de um porco voador fantástico gerada por IA
Imagem gerada por IA de um porco voador fantástico
Edição de imagens (texto e imagem para imagem)
Para fazer a edição de imagens, adicione uma imagem como entrada. O exemplo a seguir demonstra o upload de imagens codificadas em base64. Para várias imagens e payloads maiores, consulte a seção Entrada de imagem.

Python
JavaScript
Go
REST
Observação: lançamos o SDK do Google para TypeScript e JavaScript no estágio de lançamento da versão prévia. Use este SDK para recursos de geração de imagens.

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

  // Load the image from the local file system
  const imagePath = "path/to/image.png";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  // Prepare the content parts
  const contents = [
    { text: "Can you add a llama next to the image?" },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ];

  // Set responseModalities to include "Image" so the model can generate an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });
  for (const part of response.candidates[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }
}

main();
Outros modos de geração de imagens
O Gemini oferece suporte a outros modos de interação com imagens com base na estrutura e no contexto do comando, incluindo:

Texto para imagens e texto (intercalado): gera imagens com texto relacionado.
Exemplo de instrução: "Gerar uma receita ilustrada de paella".
Imagens e texto para imagens e texto (intercalado): usa imagens e texto de entrada para criar novas imagens e textos relacionados.
Exemplo de comando: (com uma imagem de um cômodo mobiliado) "Quais outras cores de sofás funcionariam no meu espaço? Você pode atualizar a imagem?"
Edição de imagens com vários turnos (chat): continue gerando / editando imagens de forma conversacional.
Exemplos de comandos: [faça upload de uma imagem de um carro azul.] , "Turn this car into a convertible.", "Agora mude a cor para amarelo."
Limitações
Para ter o melhor desempenho, use os seguintes idiomas: EN, es-MX, ja-JP, zh-CN, hi-IN.
A geração de imagens não tem suporte a entradas de áudio ou vídeo.
A geração de imagens nem sempre aciona:
O modelo pode gerar apenas texto. Tente pedir as saídas de imagem explicitamente, por exemplo, "gerar uma imagem", "fornecer imagens conforme você avança", "atualizar a imagem".
O modelo pode parar de gerar no meio do processo. Tente de novo ou use outro comando.
Ao gerar texto para uma imagem, o Gemini funciona melhor se você gerar primeiro o texto e depois pedir uma imagem com o texto.
A geração de imagens não está disponível em algumas regiões/países. Consulte Modelos para mais informações.
Gerar imagens usando o Imagen 3
Este exemplo demonstra como gerar imagens com o Imagen 3:

Python
JavaScript
Go
REST

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: 'Robot holding a red skateboard',
    config: {
      numberOfImages: 4,
    },
  });

  let idx = 1;
  for (const generatedImage of response.generatedImages) {
    let imgBytes = generatedImage.image.imageBytes;
    const buffer = Buffer.from(imgBytes, "base64");
    fs.writeFileSync(`imagen-${idx}.png`, buffer);
    idx++;
  }
}

main();
Imagem gerada por IA de um robô segurando um skate vermelho
Imagem gerada por IA de um robô segurando um skate vermelho
Parâmetros do modelo do Imagen
No momento, o Imagen só oferece suporte a comandos em inglês e aos seguintes parâmetros:

Observação: as convenções de nomenclatura dos parâmetros variam de acordo com a linguagem de programação.
numberOfImages: o número de imagens a serem geradas, de 1 a 4. O padrão é 4.
aspectRatio: muda a proporção da imagem gerada. Os valores aceitos são "1:1", "3:4", "4:3", "9:16" e "16:9". O padrão é "1:1".
personGeneration: permite que o modelo gere imagens de pessoas. Os seguintes valores são compatíveis:

"dont_allow": bloqueia a geração de imagens de pessoas.
"allow_adult": gera imagens de adultos, mas não de crianças. Esse é o padrão.
"allow_all": gera imagens que incluem adultos e crianças.
Observação: o valor do parâmetro "allow_all" não é permitido na UE, no Reino Unido, na Suíça e na região MENA.
Como escolher o modelo certo
Escolha o Gemini quando:

Você precisa de imagens relevantes para o contexto que aproveitem o conhecimento mundial e o raciocínio.
É importante combinar texto e imagens de forma integrada.
Você quer incorporar recursos visuais precisos em sequências de texto longas.
Você quer editar imagens de forma conversacional, mantendo o contexto.
Escolha Imagen 3 quando:

A qualidade da imagem, o fotorrealismo, os detalhes artísticos ou estilos específicos (por exemplo, impressionismo, anime) são as principais prioridades.
Realizar tarefas de edição especializadas, como atualizações de plano de fundo do produto ou dimensionamento de imagens.
Infundir branding, estilo ou gerar logotipos e designs de produtos.
Guia de comandos do Imagen
Esta seção do guia do Imagen mostra como modificar uma solicitação de texto para imagem pode produzir resultados diferentes, além de exemplos de imagens que você pode criar.

Noções básicas para escrever comandos
Observação: o comprimento máximo do comando é de 480 tokens.
Um bom comando é descritivo e claro, e usa modificadores e palavras-chave significativas. Comece pensando no assunto, contexto e estilo.

Foco com assunto, contexto e estilo
Texto da imagem: um esboço (estilo) de um prédio moderno (assunto) cercado por arranha-céus (contexto e plano de fundo).
Assunto: a primeira coisa a considerar com qualquer solicitação é o assunto: o objeto, a pessoa, o animal ou o cenário de que você quer uma imagem.

Contexto e plano de fundo: o mais importante é o plano de fundo ou o contexto em que o assunto será colocado. Tente colocar o objeto de várias formas. Por exemplo, um estúdio com fundo branco, ambientes externos ou ambientes internos.

Estilo: por fim, adicione o estilo da imagem que você quer usar. Os estilos podem ser gerais (pintura, fotografia, esboços) ou muito específicos (pintura pastel, desenho a carvão, isométrico 3D). Também é possível combinar estilos.

Depois de escrever uma primeira versão da proposta, aprimore adicionando mais detalhes até chegar à imagem que você quer. A iteração é importante. Comece estabelecendo sua ideia principal e, em seguida, refine e expanda essa ideia até que a imagem gerada esteja próxima da sua visão.

imagem fotorrealista de amostra 1
Instrução: Um parque na primavera ao lado de um lago
imagem fotográfica realista 2
Instrução: um parque na primavera ao lado de um lago, o sol se põe no lago, golden hour
imagem fotorrealista de amostra 3
Instrução: um parque na primavera ao lado de um lago, o sol se põe no lago, golden hour, flores silvestres vermelhas
A Imagen 3 pode transformar suas ideias em imagens detalhadas, sejam comandos curtos ou longos e detalhados. Aprimore sua visão com instruções iterativas, adicionando detalhes até alcançar o resultado perfeito.

Com comandos curtos, você gera uma imagem rapidamente.

Exemplo de comando curto da Imagen 3
Instrução: foto de uma mulher de 20 anos, fotografia de rua, imagem estática de um filme, tons quentes de laranja suave
Com comandos mais longos, você pode adicionar detalhes específicos e criar sua imagem.

Exemplo de comando longo do Imagen 3
Instrução: foto cativante de uma mulher na faixa dos 20 anos usando um estilo de fotografia de rua. A imagem precisa parecer um filme com tons quentes de laranja esmaecido.
Outros conselhos para escrever comandos da Imagen:

Use uma linguagem descritiva: use adjetivos e advérbios detalhados para descrever claramente a Imagem 3.
Forneça contexto: se necessário, inclua informações de contexto para ajudar a IA a entender.
Cite artistas ou estilos específicos: se você tem uma estética específica em mente, citar artistas ou movimentos artísticos específicos pode ser útil.
Usar ferramentas de engenharia de comando: considere explorar ferramentas ou recursos de engenharia de comando para refinar os comandos e alcançar resultados ideais.
Melhorar os detalhes faciais nas suas imagens pessoais e em grupo: especifique os detalhes faciais como foco da foto. Por exemplo, use a palavra "retrato" no comando.
Gerar texto em imagens
O Imagen pode adicionar texto a imagens, abrindo mais possibilidades criativas de geração de imagens. Use as orientações a seguir para aproveitar ao máximo esse recurso:

Iterar com confiança: talvez seja necessário regenerar imagens até alcançar o visual desejado. A integração de texto do Imagen ainda está evoluindo, e às vezes várias tentativas produzem os melhores resultados.
Mantenha o texto curto: limite o texto a 25 caracteres ou menos para uma geração ótima.
Várias frases: teste duas ou três frases diferentes para fornecer mais informações. Evite exceder três frases para composições mais limpas.

Exemplo de geração de texto do Imagen 3
Instrução: um cartaz com o texto "Summerland" em negrito como título, abaixo do texto está o slogan "Summer never felt so good"
Posicionamento do guia: embora o Imagen possa tentar posicionar o texto conforme indicado, espere variações ocasionais. Esse recurso está sempre sendo aprimorado.

Inspirar estilo de fonte: especifique um estilo de fonte geral para influenciar sutilmente as escolhas do Imagen. Não confie na replicação precisa de fontes, mas espere interpretações criativas.

Tamanho da fonte: especifique um tamanho de fonte ou uma indicação geral de tamanho (por exemplo, pequeno, médio, grande) para influenciar a geração do tamanho da fonte.

Parametrização do comando
Para controlar melhor os resultados de saída, pode ser útil parametrizar as entradas no Imagen. Por exemplo, suponha que você queira que os clientes possam gerar logotipos para a empresa e que eles sejam sempre gerados em um plano de fundo de cor sólida. Você também quer limitar as opções que o cliente pode selecionar em um menu.

Neste exemplo, você pode criar uma solicitação parametrizada semelhante a esta:


A {logo_style} logo for a {company_area} company on a solid color background. Include the text {company_name}.
Na sua interface do usuário personalizada, o cliente pode inserir os parâmetros usando um menu, e o valor escolhido preenche a imagem de comando recebida.

Exemplo:

Comando: A minimalist logo for a health care company on a solid color background. Include the text Journey.

Exemplo 1 de parametrização de comando da Imagen 3

Comando: A modern logo for a software company on a solid color background. Include the text Silo.

Exemplo 2 de parametrização de comando da Imagen 3

Comando: A traditional logo for a baking company on a solid color background. Include the text Seed.

Exemplo 3 de parametrização de comando da Imagen 3

Técnicas avançadas para a criação de prompts
Use os exemplos a seguir para criar comandos mais específicos com base em atributos como descritores de fotografia, formas e materiais, movimentos de arte históricos e modificadores de qualidade de imagem.

Fotografia
A solicitação inclui: "Uma foto de..."
Para usar esse estilo, comece usando palavras-chave que informem claramente ao Imagen que você está procurando uma fotografia. Inicie suas solicitações com "Uma foto de . ". Por exemplo:

imagem fotorrealista de amostra 1
Prompt: uma foto de grãos de café em uma cozinha em uma superfície de madeira
imagem fotográfica realista 2
Prompt: uma foto de uma barra de chocolate em um balcão de cozinha
imagem fotorrealista de amostra 3
Prompt: uma foto de um edifício moderno com água em segundo plano
Fonte da imagem: cada imagem foi gerada usando o comando de texto correspondente com o modelo Imagen 3.

Modificadores de fotografia
Nos exemplos a seguir, você pode conferir vários modificadores e parâmetros específicos para fotografia. É possível combinar vários modificadores para ter um controle mais preciso.

Proximidade da câmera - Close-up, tirada de longe


Fechar imagem da amostra da câmera
Solicitação: uma foto de perto de grãos de café
imagem de exemplo de câmera com zoom diminuído
Prompt: uma foto com zoom desativado de um pequeno saco de
grãos de café em uma cozinha bagunçada
Posição da câmera: aéreo, vista de baixo

imagem de amostra da foto aérea
Instrução: foto aérea de uma cidade com arranha-céus
uma visualização abaixo da imagem de amostra
Solicitação: uma foto de um dossel florestal com céu azul abaixo
Iluminação: natural, dramático, calor, frio

imagem de amostra de iluminação natural
Prompt: foto de estúdio de uma cadeira moderna, iluminação natural
imagem de exemplo de iluminação dramática
Prompt: foto de estúdio de uma cadeira moderna, iluminação dramática
Configurações da câmera — desfoque de movimento, foco suave, bokeh, retrato

imagem de amostra de desfoque de movimento
Prompt: foto de uma cidade com arranha-céus dentro de um carro com desfoque de movimento
imagem de amostra de foco suave
Prompt: foco suave na foto de uma ponte em uma cidade urbana à noite
Tipos de lentes - 35 mm, 50 mm, olho de peixe, grande angular, macro

imagem de amostra de lente macro
Prompt: foto de uma folha, lente macro
imagem de amostra da lente olho de peixe
Instrução: fotografia de rua, cidade de Nova York, lente olho de peixe
Tipos de filme - preto e branco, polaroid

imagem de amostra da foto polaroid
Instrução: um retrato polaroide de um cachorro usando óculos escuros
imagem de amostra de foto em preto e branco
Instrução: foto em preto e branco de um cachorro usando óculos escuros
Fonte da imagem: cada imagem foi gerada usando o comando de texto correspondente com o modelo Imagen 3.

Ilustração e arte
A solicitação inclui: "A painting de...", "Um sketch de..."
Os estilos de arte variam de estilos monocromáticos como esboços a lápis à arte digital realista. Por exemplo, as imagens a seguir usam a mesma solicitação com estilos diferentes:

"Um [art style or creation technique] de um sedan elétrico esportivo angular com arranha-céus em segundo plano"

imagens de amostra de arte
Prompt: um desenho técnico de lápis de um angular...
imagens de amostra de arte
Prompt: um desenho de carvão de um angular...
imagens de amostra de arte
Prompt: um desenho de lápis de cor de um angular...
imagens de amostra de arte
Instrução: uma pintura pastel de um angular...
imagens de amostra de arte
Prompt: uma arte digital de um angular...
imagens de amostra de arte
Prompt: um art déco (pôster) de um angular...
Fonte da imagem: cada imagem foi gerada usando o comando de texto correspondente com o modelo Imagen 2.

Formas e materiais
A solicitação inclui: "...made of...", "...na forma de..."
Um dos pontos fortes dessa tecnologia é a possibilidade de criar imagens que seriam difíceis ou impossíveis. Por exemplo, é possível recriar o logotipo da empresa em diferentes materiais e texturas.

imagem e exemplos de exemplo de imagem 1
Prompt: um saco de mochila feito de queijo
imagem e exemplos de exemplo de imagem 2
Instrução: tubos de neon no formato de um pássaro
imagem e exemplos de exemplo de imagem 3
Solicitação: uma poltrona feita de papel, foto de estúdio, estilo origami
Fonte da imagem: cada imagem foi gerada usando o comando de texto correspondente com o modelo Imagen 3.

Referências de arte históricas
A solicitação inclui: "...in the style of..."
Alguns estilos se tornaram icônicos ao longo dos anos. Confira a seguir algumas ideias de pintura histórica ou estilos de arte que você pode testar.

"gerar uma imagem no estilo de [art period or movement] : um parque eólico"

imagem de exemplo de impressionismo
Instrução: gere uma imagem no estilo de uma pintura impressionista: um parque eólico
imagem de exemplo do renascentista
Instrução: gerar uma imagem no estilo de uma pintura renascentista: um parque eólico
imagem de exemplo de pop art
Prompt: gerar uma imagem no estilo de pop art: um parque eólico
Fonte da imagem: cada imagem foi gerada usando o comando de texto correspondente com o modelo Imagen 3.

Modificadores de qualidade da imagem
Algumas palavras-chave podem informar ao modelo que você está procurando um recurso de alta qualidade. Veja alguns exemplos de modificadores de qualidade:

Modificadores gerais: alta qualidade, bonito, estilizado
Fotos: fotos 4K, HDR e do Studio
Arte, Ilustração: por um profissional, detalhado
Veja a seguir alguns exemplos de prompts sem modificadores de qualidade e o mesmo com modificadores de qualidade.

imagem de exemplo de milho sem modificadores
Solicitação (sem modificadores de qualidade): uma foto de um talo de milho
imagem de exemplo de milho com modificadores
Instrução (com modificadores de qualidade): 4K HDR bonito
foto de uma haste de milho tirada por um fotógrafo profissional de
Fonte da imagem: cada imagem foi gerada usando o comando de texto correspondente com o modelo Imagen 3.

Proporções
A geração de imagens do Imagen 3 permite definir cinco proporções de imagem distintas.

Quadrado (1:1, padrão): uma foto quadrada padrão. Usos comuns para essa proporção incluem postagens de mídias sociais.
Tela cheia (4:3): essa proporção é usada com frequência em mídias ou filmes. Elas também têm as mesmas dimensões da maioria das TVs e câmeras de formato médio antigas. Ela captura mais da cena horizontalmente (em comparação com 1:1), o que a torna uma proporção preferencial para fotografia.

exemplo de proporção
Instrução: close dos dedos de um músico tocando piano, filme em preto e branco, vintage (proporção de 4:3)
exemplo de proporção
Instrução: uma foto profissional de um estúdio que mostra batatas fritas para um restaurante sofisticado, no estilo de uma revista de culinária (proporção de 4:3) )
Tela cheia em modo retrato (3:4): é a proporção de tela cheia girada em 90 graus. Isso permite capturar mais da cena verticalmente em comparação com a proporção de 1:1.

exemplo de proporção
Instrução: uma mulher caminhando, perto de suas botas refletidas em uma poça, grandes montanhas ao fundo, no estilo de um anúncio, ângulos dramáticos (proporção 3:4)
exemplo de proporção
Instrução: imagem aérea de um rio fluindo por um vale místico (proporção 3:4)
Widescreen (16:9): essa proporção substituiu a de 4:3 e agora é a proporção mais comum para TVs, monitores e telas de smartphones (paisagem). Use essa proporção quando quiser capturar mais do plano de fundo (por exemplo, paisagens panorâmicas).

exemplo de proporção
Instrução: um homem vestindo roupas brancas sentado na praia, de perto, com iluminação de golden hour (proporção de 16:9){101
Retrato (9:16): essa proporção é widescreen, mas girada. Essa é uma proporção relativamente nova que ficou conhecida por apps de vídeos mais curtos (por exemplo, YouTube Shorts). Use essa opção para objetos altos com fortes orientações verticais, como edifícios, árvores, cachoeiras ou outros objetos semelhantes.

exemplo de proporção
Prompt: uma renderização digital de um arranha-céu enorme, moderno, grandioso, épico com um lindo pôr do sol ao fundo (proporção de 9:16){101
Imagens fotorrealistas
Versões diferentes do modelo de geração de imagens podem oferecer uma combinação de saídas artísticas e fotorrealistas. Use a seguinte palavra nos comandos para gerar uma saída mais fotorrealista com base no assunto que quiser gerar.

Observação: considere essas palavras-chave como orientação geral ao tentar criar imagens fotorrealistas. Elas não são necessárias para atingir sua meta.
Caso de uso	Tipo de lente	Distâncias focais	Mais detalhes
Pessoas (retratos)	Prime, zoom	24-35mm	filme em preto e branco, Filme noir, Profundidade de campo, duotone (mencione duas cores)
Comida, insetos, plantas (objetos, natureza morta)	Macro	60-105mm	Alto nível de detalhes, foco preciso, iluminação controlada
Esportes, vida selvagem (movimento)	Zoom telefoto	100-400mm	Velocidade rápida do obturador, rastreamento de ação ou movimento
Astronômico, paisagem (amplo angular)	Grande angular	10-24mm	Longos tempos de exposição, foco nítido, exposição longa, água suave ou nuvens
Retratos
Caso de uso	Tipo de lente	Distâncias focais	Mais detalhes
Pessoas (retratos)	Prime, zoom	24-35mm	filme em preto e branco, Filme noir, Profundidade de campo, duotone (mencione duas cores)
Usando várias palavras-chave da tabela, o Imagen pode gerar os seguintes retratos:

exemplo de fotografia de retrato	exemplo de fotografia de retrato	exemplo de fotografia de retrato	exemplo de fotografia de retrato
Comando: uma mulher, retrato de 35 mm, duotons azul e cinza
Modelo: imagen-3.0-generate-002

exemplo de fotografia de retrato	exemplo de fotografia de retrato	exemplo de fotografia de retrato	exemplo de fotografia de retrato
Comando: A mulher, retrato de 35 mm, film noir
Modelo: imagen-3.0-generate-002

Objetos
Caso de uso	Tipo de lente	Distâncias focais	Mais detalhes
Comida, insetos, plantas (objetos, natureza morta)	Macro	60-105mm	Alto nível de detalhes, foco preciso, iluminação controlada
Usando várias palavras-chave da tabela, o Imagen pode gerar as seguintes imagens de objeto:

exemplo de fotografia de objeto	exemplo de fotografia de objeto	exemplo de fotografia de objeto	exemplo de fotografia de objeto
Comando: folha de uma planta de oração, lente macro, 60 mm
Modelo: imagen-3.0-generate-002

exemplo de fotografia de objeto	exemplo de fotografia de objeto	exemplo de fotografia de objeto	exemplo de fotografia de objeto
Comando: um prato de macarrão, lente macro de 100 mm
Modelo: imagen-3.0-generate-002

Movimento
Caso de uso	Tipo de lente	Distâncias focais	Mais detalhes
Esportes, vida selvagem (movimento)	Zoom telefoto	100-400mm	Velocidade rápida do obturador, rastreamento de ação ou movimento
Usando várias palavras-chave da tabela, o Imagen pode gerar as seguintes imagens em movimento:

exemplo de fotografia com movimento	exemplo de fotografia com movimento	exemplo de fotografia com movimento	exemplo de fotografia com movimento
Comando: um touchdown vencedor, velocidade do obturador rápida e rastreamento de movimento
Modelo: imagen-3.0-generate-002

exemplo de fotografia com movimento	exemplo de fotografia com movimento	exemplo de fotografia com movimento	exemplo de fotografia com movimento
Comando: um cervo correndo na floresta, alta velocidade do obturador, rastreamento de movimento
Modelo: imagen-3.0-generate-002

Grande angular
Caso de uso	Tipo de lente	Distâncias focais	Mais detalhes
Astronômico, paisagem (amplo angular)	Grande angular	10-24mm	Longos tempos de exposição, foco nítido, exposição longa, água suave ou nuvens
Usando várias palavras-chave da tabela, o Imagen pode gerar as seguintes imagens grande angulares:

Exemplo de fotografia grande angular	Exemplo de fotografia grande angular	Exemplo de fotografia grande angular	Exemplo de fotografia grande angular
Comando: uma ampla cordilheira, ângulo amplo de paisagem de 10 mm
Modelo: imagen-3.0-generate-002

Exemplo de fotografia grande angular	Exemplo de fotografia grande angular	Exemplo de fotografia grande angular	Exemplo de fotografia grande angular
Comando: uma foto da lua, fotografia astronômica, ângulo amplo de 10 mm
Modelo: imagen-3.0-generate-002