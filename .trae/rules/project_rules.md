# Regras para Codificação de Qualidade do Projeto RG Pulse

Este documento estabelece as diretrizes e melhores práticas a serem seguidas durante o desenvolvimento do projeto RG Pulse para garantir a qualidade, manutenibilidade, segurança e desempenho do código.

## 1. Estrutura e Organização do Código

-   **Mantenha o código DRY (Don't Repeat Yourself - Não Se Repita)**
    -   Extraia lógica repetida em funções reutilizáveis.
    -   Crie funções utilitárias para operações comuns (validação, formatação, etc.).
    -   Use componentes compartilhados para padrões de UI que aparecem várias vezes.

-   **Divida arquivos grandes**
    -   Utilize SOLID para escrita de código, especialmente em Single Responsability (Princípio da Responsabilidade Única) e Open-Closed Principle (Princípio Aberto/Fechado).
    -   Divida arquivos maiores que 300-400 linhas em módulos menores e mais focados.
    -   Separe as responsabilidades: busca de dados (data fetching), lógica de negócios (business logic), renderização de UI.
    -   Crie componentes focados que fazem uma coisa bem.

-   **Use organização lógica de arquivos**
    -   Agrupe arquivos relacionados por funcionalidade (feature) ou domínio.
    -   Crie diretórios separados para componentes (`components/`), utilitários (`utils/`), serviços (`services/`), páginas (`pages/`), hooks (`hooks/`), etc.
    -   Siga convenções de nomenclatura consistentes em todo o projeto (ex: `PascalCase` para componentes React, `camelCase` para funções e variáveis).

## 2. Práticas de Segurança

-   **Validação e Sanitização de Entrada**
    -   Valide todas as entradas do usuário tanto no cliente (frontend) quanto no servidor (backend).
    -   Use consultas parametrizadas para todas as operações de banco de dados para prevenir injeção de SQL.
    -   Sanitize quaisquer dados antes de renderizá-los na UI para evitar ataques XSS (Cross-Site Scripting).

-   **Autenticação e Autorização**
    -   Proteja rotas sensíveis com middleware de autenticação.
    -   Implemente verificações adequadas de autorização para acesso a dados e funcionalidades.
    -   Considere o uso de permissões baseadas em papéis (role-based access control - RBAC) se diferentes tipos de usuários existirem.

-   **Segurança de API**
    -   Implemente limitação de taxa (rate limiting) em endpoints críticos, especialmente os de autenticação, para prevenir ataques de força bruta.
    -   Configure cabeçalhos HTTP seguros:
        -   **CORS (Cross-Origin Resource Sharing):** Defina origens permitidas explicitamente. Evite usar `*` em produção.
        -   **Content-Security-Policy (CSP):** Ajuda a prevenir XSS e outros ataques de injeção.
        -   Outros cabeçalhos relevantes: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
    -   Use HTTPS para todas as conexões em todos os ambientes (desenvolvimento, homologação, produção).

-   **Gerenciamento de Segredos**
    -   Nunca inclua segredos (chaves de API, senhas de banco de dados, etc.) diretamente no código-fonte ou em commits do Git.
    -   Armazene valores sensíveis em variáveis de ambiente.
    -   Utilize arquivos `.env` específicos para cada ambiente:
        -   `.env.development` (ou `.env.dev`) para desenvolvimento local.
        -   `.env.staging` (ou `.env.homolog`) para ambiente de homologação/testes.
        -   `.env.production` (ou `.env.prod`) para o ambiente de produção.
    -   Carregue as variáveis de ambiente apropriadas com base no ambiente de execução (ex: usando `dotenv` e scripts NPM/Bun).
    -   Para o frontend (Vite), as variáveis de ambiente devem ser prefixadas com `VITE_` (ex: `VITE_API_URL`).

## 3. Tratamento de Erros

-   **Implemente tratamento abrangente de erros**
    -   Capture e trate diferentes tipos de erros de forma específica (ex: erros de rede, erros de validação, erros de servidor).
    -   Registre erros com contexto suficiente para depuração (stack trace, mensagem, dados relevantes da requisição).
    -   Apresente mensagens de erro amigáveis e úteis na interface do usuário, sem expor detalhes sensíveis da implementação.

-   **Trate operações assíncronas adequadamente**
    -   Use blocos `try/catch` com `async/await` ou `.catch()` para Promises.
    -   Trate falhas de rede com elegância (ex: exibindo uma mensagem e permitindo nova tentativa).
    -   Considere implementar timeouts e mecanismos de retry para chamadas de API críticas, visando a resiliência.
    -   Implemente estados de carregamento (loading states) e feedback visual para o usuário durante operações assíncronas.

## 4. Otimização de Desempenho

-   **Minimize operações caras**
    -   Armazene em cache (caching) resultados de cálculos custosos ou dados frequentemente acessados (ex: usando React Query/TanStack Query).
    -   Use memorização (ex: `React.memo`, `useMemo`) para componentes e funções puras.
    -   Implemente paginação para grandes conjuntos de dados, tanto no frontend quanto nas APIs.

-   **Evite vazamentos de memória**
    -   Limpe event listeners e inscrições (subscriptions) quando componentes são desmontados (ex: no `useEffect` cleanup function).
    -   Cancele requisições de API pendentes quando o componente que as iniciou é desmontado.
    -   Limpe intervalos (`setInterval`) e timeouts (`setTimeout`) quando não forem mais necessários.

-   **Otimize a renderização (Frontend)**
    -   Evite re-renderizações desnecessárias de componentes (ex: usando `React.memo`, `useCallback`, `useMemo`, e otimizando dependências de `useEffect`).
    -   Use virtualização (virtual scrolling/windowing) para listas longas.
    -   Implemente divisão de código (code splitting) por rota e carregamento preguiçoso (lazy loading) para componentes e imagens.

## 5. Melhores Práticas de Banco de Dados (se aplicável ao backend)

-   **Use transações para operações relacionadas**
    -   Agrupe múltiplas operações de banco de dados que devem ser atômicas em transações.
    -   Garanta consistência de dados e implemente mecanismos adequados de rollback em caso de falha.

-   **Otimize consultas**
    -   Crie índices para campos frequentemente usados em cláusulas `WHERE`, `JOIN`, e `ORDER BY`.
    -   Selecione apenas os campos necessários (`SELECT col1, col2` em vez de `SELECT *`).
    -   Use paginação de consulta ao buscar grandes conjuntos de dados.

-   **Trate conexões de banco de dados adequadamente**
    -   Use pools de conexão para gerenciar e reutilizar conexões de forma eficiente.
    -   Certifique-se de que as conexões sejam fechadas ou retornadas ao pool após a conclusão das operações.
    -   Implemente mecanismos de retry para falhas transitórias de conexão.

## 6. Design de API (para o servidor proxy/backend)

-   **Siga princípios RESTful (ou GraphQL, conforme aplicável)**
    -   Use verbos HTTP apropriados:
        -   `GET`: Para buscar recursos.
        -   `POST`: Para criar novos recursos.
        -   `PUT`: Para atualizar um recurso existente completamente.
        -   `PATCH`: Para atualizar parcialmente um recurso existente.
        -   `DELETE`: Para remover um recurso.
    -   Use códigos de status HTTP significativos:
        -   `2xx` (Sucesso): `200 OK`, `201 Created`, `204 No Content`.
        -   `3xx` (Redirecionamento): `301 Moved Permanently`, `302 Found`.
        -   `4xx` (Erro do Cliente): `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`.
        -   `5xx` (Erro do Servidor): `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`.
    -   Retorne formatos de resposta consistentes (JSON é o padrão).

-   **Projete endpoints claros e consistentes**
    -   Organize endpoints por recurso (ex: `/users`, `/products`).
    -   Versione sua API (ex: `/api/v1/users`) para facilitar futuras atualizações sem quebrar clientes existentes.
    -   Documente todos os endpoints com exemplos de requisição e resposta (ex: usando Swagger/OpenAPI).

-   **Implemente respostas de erro adequadas**
    -   Retorne objetos de erro JSON estruturados, incluindo um código de erro específico da aplicação e uma mensagem clara.
    -   Mantenha logs detalhados de erros da API no servidor para facilitar a depuração.

## 7. Manutenabilidade

-   **Use nomenclatura clara e consistente**
    -   Escolha nomes descritivos para variáveis, funções, classes, componentes e arquivos.
    -   Evite abreviações excessivas e nomes enigmáticos.
    -   Siga as convenções de nomenclatura da linguagem/framework (ex: `PascalCase` para componentes React e classes, `camelCase` para funções e variáveis em JavaScript/TypeScript).

-   **Adicione documentação e comentários**
    -   Documente funções complexas, lógica de negócios importante e APIs públicas com descrições claras (ex: JSDoc para TypeScript/JavaScript).
    -   Explique o "porquê" da implementação, não apenas o "o quê".
    -   Mantenha a documentação e os comentários atualizados quando o código muda.
    -   Comente seções de código que não são imediatamente óbvias.

-   **Escreva testes**
    -   Cubra lógica de negócios crítica e funções utilitárias com testes unitários (ex: usando Vitest/Jest).
    -   Escreva testes de integração para fluxos importantes que envolvem múltiplos componentes ou módulos.
    -   Considere testes end-to-end (E2E) para jornadas críticas do usuário (ex: usando Playwright/Cypress).
    -   Mantenha uma boa cobertura de testes e execute-os regularmente (ex: em pipelines de CI/CD).

## 8. Específico para Frontend (React/Vite/TypeScript)

-   **Implemente validação de formulários robusta**
    -   Valide a entrada do usuário à medida que digitam (on-the-fly) e no envio do formulário.
    -   Forneça mensagens de erro claras e específicas para cada campo.
    -   Trate erros de envio de formulário (ex: falhas de API) com elegância, informando o usuário.
    -   Utilize bibliotecas de validação como Zod ou Yup para definir esquemas de validação.

-   **Use gerenciamento de estado adequado**
    -   Escolha a estratégia de gerenciamento de estado apropriada para a complexidade da aplicação:
        -   Estado local do componente (`useState`, `useReducer`) para UI simples.
        -   Context API para compartilhar estado entre componentes aninhados sem prop drilling excessivo.
        -   Bibliotecas de gerenciamento de estado global (Zustand, Redux Toolkit) para estados complexos e compartilhados em toda a aplicação.
        -   TanStack Query (React Query) para gerenciar estado do servidor (data fetching, caching, mutations).
    -   Mantenha o estado o mais próximo possível de onde é necessário.

-   **Garanta acessibilidade (a11y)**
    -   Use elementos HTML semânticos (`<nav>`, `<main>`, `<article>`, `<button>`, etc.).
    -   Adicione atributos ARIA (Accessible Rich Internet Applications) adequados para componentes complexos e interativos, quando o HTML semântico não for suficiente.
    -   Garanta navegabilidade completa por teclado para todos os elementos interativos.
    -   Mantenha contraste de cor suficiente entre texto e fundo.
    -   Forneça texto alternativo (alt text) para imagens.
    -   Teste a acessibilidade com ferramentas e leitores de tela.

## 9. Vulnerabilidades de Segurança a Prevenir (Revisão)

-   **Injeção SQL/NoSQL:**
    -   Sempre use consultas parametrizadas ou ORM/ODM que façam isso por baixo dos panos.
    -   Exemplo (Node.js com `mysql2` ou similar): `connection.execute('SELECT * FROM users WHERE id = ?', [userId]);`

-   **Cross-Site Scripting (XSS):**
    -   Sanitize a entrada do usuário antes de exibi-la no HTML. Frameworks como React já fazem um bom trabalho ao escapar conteúdo por padrão, mas seja cuidadoso ao usar `dangerouslySetInnerHTML`.
    -   Use Content Security Policy (CSP).

-   **Cross-Site Request Forgery (CSRF):**
    -   Implemente tokens anti-CSRF para requisições que modificam o estado (POST, PUT, DELETE).
    -   Verifique o cabeçalho `Origin` ou `Referer` em requisições (com ressalvas, pois podem ser falsificados).
    -   Use o atributo `SameSite` para cookies.

-   **Autenticação Quebrada:**
    -   Implemente gerenciamento de sessão seguro (ex: cookies HTTPOnly, Secure, SameSite).
    -   Use hash seguro e com salt para senhas (ex: bcrypt, Argon2).
    -   Imponha políticas de senha forte e considere autenticação de múltiplos fatores (MFA).
    -   Proteja contra ataques de enumeração de usuários.

## 10. Processo de Desenvolvimento e Colaboração

-   **Controle de Versão (Git):**
    -   Siga um fluxo de trabalho consistente (ex: Gitflow, GitHub Flow).
    -   Crie branches para novas funcionalidades e correções (`feature/nome-da-feature`, `fix/descricao-do-fix`).
    -   Escreva mensagens de commit claras e descritivas.
    -   Faça Pull Requests (PRs) para revisão de código antes de mesclar na branch principal (`main` ou `develop`).
-   **Revisão de Código (Code Review):**
    -   Pelo menos um outro desenvolvedor deve revisar o código antes do merge.
    -   Foco em qualidade, aderência às regras, potenciais bugs e melhorias.
-   **Integração Contínua / Implantação Contínua (CI/CD):**
    -   Automatize builds, testes e deployments sempre que possível.


Este documento é vivo e deve ser atualizado conforme o projeto evolui e novas melhores práticas são identificadas.