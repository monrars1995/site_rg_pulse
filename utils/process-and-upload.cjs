const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:3001';
const RAW_JSON_FILE = process.argv[2] || 'raw-json-content.txt';

async function processAndUpload() {
    try {
        console.log(`🔍 Processando arquivo: ${RAW_JSON_FILE}`);
        
        // Verificar se o arquivo existe
        if (!fs.existsSync(RAW_JSON_FILE)) {
            throw new Error(`Arquivo ${RAW_JSON_FILE} não encontrado. Use: node process-and-upload.cjs [caminho-do-arquivo]`);
        }
        
        // Ler o conteúdo bruto
        const rawContent = fs.readFileSync(RAW_JSON_FILE, 'utf8');
        
        console.log('🧹 Limpando e reconstruindo JSON...');
        
        // Primeiro, vamos remover o \n inicial
        let content = rawContent.trim();
        if (content.startsWith('\\n')) {
            content = content.substring(2);
        }
        
        // Processar escapes básicos
        content = content.replace(/\\n/g, '\n');
        content = content.replace(/\\\"/g, '"');
        
        // Extrair campos usando regex mais robustas
        const titleMatch = content.match(/"title":\s*"([^"]+)"/s);
        const summaryMatch = content.match(/"summary":\s*"([^"]+)"/s);
        const slugMatch = content.match(/"suggested_slug":\s*"([^"]+)"/s);
        const timeMatch = content.match(/"estimated_read_time_minutes":\s*(\d+)/s);
        const imageMatch = content.match(/"cover_image_url":\s*"([^"]+)"/s);
        
        // Extrair conteúdo markdown (mais complexo devido aos escapes)
        const contentStart = content.indexOf('"content_markdown":');
        if (contentStart === -1) throw new Error('Campo content_markdown não encontrado');
        
        // Encontrar o início do valor
        const valueStart = content.indexOf('"', contentStart + 19) + 1;
        
        // Encontrar o fim do valor (procurar pela próxima chave)
        const nextFieldStart = content.indexOf('"cover_image_url":', valueStart);
        if (nextFieldStart === -1) throw new Error('Não foi possível encontrar o fim do content_markdown');
        
        // Extrair o conteúdo markdown
        let markdownContent = content.substring(valueStart, nextFieldStart - 3); // -3 para remover ",\n
        // Limpar o conteúdo markdown
        markdownContent = markdownContent
            .replace(/\\n/g, '\n')
            .replace(/\\\"/g, '"')
            .replace(/\\\\/g, '/')
            .trim();
        
        // Extrair tags
        const tagsStart = content.indexOf('"tags":');
        const tagsArrayStart = content.indexOf('[', tagsStart);
        const tagsArrayEnd = content.indexOf(']', tagsArrayStart) + 1;
        const tagsString = content.substring(tagsArrayStart, tagsArrayEnd);
        
        // Processar tags
        const tagsArray = JSON.parse(tagsString.replace(/\\n/g, '').replace(/\s+/g, ' '));
        
        // Construir o objeto JSON final
        const blogPost = {
            title: titleMatch ? titleMatch[1] : '',
            summary: summaryMatch ? summaryMatch[1] : '',
            content_markdown: markdownContent,
            cover_image_url: imageMatch ? imageMatch[1] : '',
            estimated_read_time_minutes: timeMatch ? parseInt(timeMatch[1]) : 5,
            tags: tagsArray,
            slug: slugMatch ? slugMatch[1] : ''
        };
        
        console.log('✅ JSON reconstruído com sucesso!');
        console.log('\n📋 Informações do post:');
        console.log('Título:', blogPost.title);
        console.log('Resumo:', blogPost.summary.substring(0, 100) + '...');
        console.log('Tags:', blogPost.tags.join(', '));
        console.log('Slug sugerido:', blogPost.slug);
        console.log('Tempo estimado de leitura:', blogPost.estimated_read_time_minutes, 'minutos');
        console.log('URL da imagem:', blogPost.cover_image_url);
        
        // Salvar o JSON processado localmente (opcional)
        const outputFilename = path.basename(RAW_JSON_FILE, path.extname(RAW_JSON_FILE)) + '-processed.json';
        fs.writeFileSync(outputFilename, JSON.stringify(blogPost, null, 2), 'utf8');
        console.log(`\n📄 JSON processado salvo em: ${outputFilename}`);
        
        // Enviar para a API
        console.log('\n🚀 Enviando para a API...');
        const response = await fetch(`${API_URL}/api/v1/blog/admin/create-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Adicione aqui cabeçalhos de autenticação se necessário
                // 'x-admin-api-key': process.env.ADMIN_API_KEY
            },
            body: JSON.stringify(blogPost)
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            console.log('✅ Post criado com sucesso!');
            console.log('ID:', responseData.post.id);
            console.log('Slug final:', responseData.post.slug);
            console.log(`URL do post: ${API_URL}/blog/${responseData.post.slug}`);
        } else {
            console.error('❌ Erro ao criar post:', responseData.error);
            if (responseData.details) {
                console.error('Detalhes:', responseData.details);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

processAndUpload();