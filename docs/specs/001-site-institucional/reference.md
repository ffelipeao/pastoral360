# Pastoral 360 — Referência do site institucional

> Documento de contexto da spec executável em `spec.md`. Ele reúne visão do
> produto, arquitetura de conteúdo, requisitos e decisões de escopo.

## 1. Visão do produto

A **Pastoral 360** é uma plataforma de gestão integrada para igrejas. O produto centraliza rotinas administrativas, financeiras, ministeriais e operacionais em um único ambiente, inclusive para igrejas com filiais.

**Proposta de valor:** tudo o que a igreja precisa para uma gestão 360°, na palma da mão.

**Objetivo desta primeira versão:** criar uma landing page estática, moderna e responsiva que apresente claramente o produto, gere confiança e converta visitantes em contatos comerciais ou pedidos de demonstração.

## 2. Objetivos do site

1. Explicar a Pastoral 360 em menos de 30 segundos.
2. Demonstrar a amplitude dos módulos sem tornar a página cansativa.
3. Mostrar benefícios para igrejas de diferentes tamanhos e com múltiplas filiais.
4. Gerar pedidos de demonstração e conversas via WhatsApp.
5. Preparar uma base visual e técnica que possa evoluir para o site definitivo.

## 3. Público-alvo

### Público principal

- Pastores e líderes responsáveis pela administração da igreja.
- Secretários, tesoureiros e equipes administrativas.
- Igrejas-sede que precisam acompanhar filiais e congregações.

### Público secundário

- Líderes de departamentos e ministérios.
- Coordenadores de Escola Bíblica Dominical e pequenos grupos.
- Equipes de comunicação responsáveis pelo site público da igreja.

### Principais dores

- Informações espalhadas entre planilhas, papéis e aplicativos.
- Falta de visão consolidada da igreja e de suas filiais.
- Processos repetitivos e emissão manual de documentos.
- Dificuldade para acompanhar pessoas, departamentos, patrimônio e eventos.
- Relatórios insuficientes para decisões pastorais e administrativas.

## 4. Posicionamento e mensagem

### Promessa principal

**Sua igreja organizada por completo, em um só lugar.**

### Texto de apoio sugerido

Centralize secretaria, tesouraria, pessoas, departamentos, filiais, eventos, patrimônio, Escola Bíblica Dominical e pequenos grupos em uma plataforma simples, segura e acessível.

### Tom de voz

- Acolhedor, confiável e humano.
- Claro e objetivo; evitar linguagem técnica desnecessária.
- Profissional, sem perder a proximidade com a rotina da igreja.
- Não prometer funcionalidades, integrações ou garantias ainda não confirmadas.

### Chamadas para ação

- Primária: **Solicitar demonstração**.
- Secundária: **Conhecer os recursos**.
- Alternativa no fim da página: **Falar pelo WhatsApp**.

## 5. Escopo do MVP estático

### Incluído

- Página única institucional.
- Navegação por âncoras.
- Layout responsivo para celular, tablet e desktop.
- Apresentação dos módulos, públicos e benefícios.
- Seção sobre gestão de igrejas filiais.
- Chamadas para pedido de demonstração.
- Formulário visual de contato com validação no navegador.
- Links configuráveis para WhatsApp e redes sociais.
- Metadados básicos para SEO e compartilhamento social.
- Boas práticas básicas de acessibilidade e desempenho.

### Fora do MVP

- Autenticação e área interna do sistema.
- Banco de dados ou painel administrativo.
- Backend além do endpoint PHP exclusivo para envio do formulário de contato.
- Pagamento, contratação e planos comerciais.
- Blog, central de ajuda ou integração com CRM.
- Demonstração funcional dos módulos.

Esses itens podem ser simulados visualmente, mas devem estar identificados como demonstração quando ainda não existirem.

## 6. Arquitetura da página

### 6.1 Cabeçalho

- Logotipo/nome Pastoral 360.
- Links: Início, Recursos, Para sua igreja, Filiais e Contato.
- Botão destacado: Solicitar demonstração.
- Menu compacto em telas menores.

### 6.2 Hero

- Selo curto: “Gestão completa para igrejas”.
- Título com a promessa principal.
- Parágrafo explicativo.
- CTA primária e CTA secundária.
- Mockup do sistema em notebook/celular ou composição visual de dashboard.
- Pequenos indicadores de confiança, somente com dados reais ou frases não quantitativas.

### 6.3 Problema e transformação

Comparação visual simples:

- Antes: planilhas, informações dispersas, retrabalho e pouca visibilidade.
- Com a Pastoral 360: processos centralizados, equipes alinhadas e decisões apoiadas por relatórios.

### 6.4 Visão geral dos recursos

Organizar os recursos em grupos para reduzir a carga visual.

#### Administração e finanças

- Secretaria.
- Tesouraria.
- Controle de patrimônio.
- Relatórios personalizados.

#### Pessoas e jornada pastoral

- Gestão de novos convertidos.
- Gestão de candidatos ao batismo.
- Apresentação de crianças com emissão de certificado.
- Acompanhamento de membros e pequenos grupos.

#### Cultos e formação

- Agenda de cultos e eventos.
- Gestão da Escola Bíblica Dominical (EBD).
- Gestão de pequenos grupos.

#### Comunicação e ministérios

- Gestão do site público da igreja.
- Gestão de departamentos: Jovens, Crianças, Irmãs e Varões.
- Estrutura preparada para outros departamentos.

Cada cartão deve ter ícone, nome, descrição de uma frase e, quando útil, um benefício direto.

### 6.5 Gestão de filiais

Seção de destaque para o diferencial multi-igreja:

- Visão consolidada da sede e das filiais.
- Usuários com acesso limitado à própria filial.
- Padronização dos processos administrativos.
- Acompanhamento respeitando os níveis de permissão.

Evitar afirmações específicas sobre segurança, auditoria ou conformidade até que sejam tecnicamente validadas.

### 6.6 Benefícios por perfil

Abas ou cartões para:

- Liderança: visão ampla e informações para decisões.
- Secretaria: organização de cadastros, jornadas e documentos.
- Tesouraria: centralização das rotinas financeiras.
- Líderes de departamento: autonomia com acesso ao que precisam.
- Comunicação: atualização do site público e divulgação da agenda.

### 6.7 Como funciona

Fluxo comercial em três passos:

1. Solicite uma demonstração.
2. Conheça os módulos adequados à sua igreja.
3. Organize a operação da sede, filiais e ministérios.

### 6.8 Depoimentos ou prova social

- No protótipo, usar bloco reservado com conteúdo explicitamente ilustrativo ou ocultar a seção.
- Não inventar nomes, igrejas, avaliações ou números.
- Quando houver clientes reais, incluir de dois a três depoimentos autorizados.

### 6.9 Perguntas frequentes

Perguntas iniciais sugeridas:

- A Pastoral 360 atende igrejas com filiais?
- É possível limitar o acesso de cada usuário?
- Quais áreas da igreja podem ser gerenciadas?
- O sistema pode ser acessado pelo celular?
- Como solicito uma demonstração?

As respostas finais dependem de validação com o responsável pelo produto.

### 6.10 CTA final e contato

- Reforço da promessa do produto.
- Botões para demonstração e WhatsApp.
- Formulário: nome, igreja, cidade/UF, telefone com WhatsApp obrigatório, e-mail opcional e mensagem.
- Consentimento de contato e link para política de privacidade antes de ativar coleta real.

### 6.11 Rodapé

- Marca e resumo curto.
- Links de navegação.
- Contato e redes sociais confirmadas.
- Política de privacidade e termos, quando disponíveis.
- Aviso de direitos autorais com ano automático.

## 7. Direção visual

### Conceito

Uma interface limpa e acolhedora, inspirada em organização, cuidado e visão integrada. O visual deve transmitir tecnologia sem parecer frio ou excessivamente corporativo.

### Paleta inicial

- Azul profundo: confiança e estrutura.
- Azul/verde vibrante: inovação e ação.
- Dourado suave como acento opcional: acolhimento e identidade pastoral.
- Fundos claros em tons neutros e alto contraste para textos.

As cores finais devem ser transformadas em tokens e testadas conforme WCAG.

### Tipografia

- Títulos: fonte sem serifa de personalidade moderna.
- Texto: fonte sem serifa altamente legível.
- Carregamento otimizado e fallback de sistema.

### Componentes visuais

- Cards com bordas suaves e sombras discretas.
- Ícones consistentes, preferencialmente de uma única biblioteca.
- Mockup principal do dashboard.
- Detalhes gráficos sutis que sugiram conexão entre módulos.
- Entrada progressiva e sutil dos cards conforme eles entram na área visível durante a rolagem.
- Animações curtas e opcionais, respeitando `prefers-reduced-motion` e sem ocultar conteúdo quando JavaScript estiver indisponível.
- Alternância entre tema claro e escuro, com paletas próprias e contraste adequado nos dois modos.

## 8. Requisitos funcionais

- Todos os links de navegação devem levar à seção correta.
- O menu móvel deve abrir, fechar e manter navegação por teclado.
- O cabeçalho deve oferecer um botão acessível para alternar entre os temas claro e escuro.
- O tema inicial deve considerar a preferência do sistema e escolhas manuais devem ser persistidas no navegador.
- CTAs devem apontar para o formulário ou WhatsApp configurado.
- O formulário deve validar campos obrigatórios e informar sucesso/erro de forma acessível.
- O endpoint PHP deve validar os dados novamente, usar remetente ativo do domínio e retornar sucesso somente após a função de envio confirmar aceitação.
- FAQ deve funcionar por teclado e expor corretamente o estado aberto/fechado.
- Conteúdo essencial deve permanecer disponível sem animações.
- Cards devem aparecer progressivamente durante a rolagem, sem bloquear leitura, navegação ou indexação.

## 9. Requisitos não funcionais

### Responsividade

- Larguras de referência: 360 px, 768 px, 1024 px e 1440 px.
- Sem rolagem horizontal.
- Áreas de toque com pelo menos 44 × 44 px.

### Acessibilidade

- HTML semântico e ordem lógica de títulos.
- Contraste mínimo compatível com WCAG 2.2 AA.
- Navegação completa por teclado e foco visível.
- Textos alternativos para imagens informativas.
- Labels associados aos campos do formulário.
- Respeito às preferências de redução de movimento.

### Desempenho

- Imagens em formatos modernos e tamanhos responsivos.
- JavaScript mínimo para a experiência estática.
- Evitar dependências pesadas sem necessidade.
- Meta inicial no Lighthouse mobile: 90+ em Desempenho, Acessibilidade, Boas Práticas e SEO, admitindo revisão conforme hospedagem e ativos finais.

### SEO

- Título e descrição únicos.
- URL canônica configurável.
- Open Graph e imagem de compartilhamento.
- Dados estruturados de `SoftwareApplication` apenas com informações confirmadas.
- Um único `h1`, conteúdo indexável e linguagem `pt-BR`.

## 10. Conteúdo e dados pendentes

Antes da publicação, confirmar:

- Logotipo e identidade visual existentes.
- URL oficial e hospedagem.
- Número de WhatsApp e e-mail comercial.
- Redes sociais.
- Capturas reais ou conceito visual do sistema.
- Lista exata de funcionalidades já disponíveis e planejadas.
- Modelo comercial: assinatura, implantação, teste ou demonstração.
- Depoimentos, quantidade de clientes e métricas reais.
- Política de privacidade, responsável pelo tratamento de dados e fluxo do formulário.

## 11. Estratégia técnica sugerida

Para o protótipo inicial, usar uma implementação estática com poucos requisitos de infraestrutura. A escolha final deve considerar o ecossistema já usado no produto.

### Opção recomendada para o protótipo

- HTML semântico, CSS organizado por tokens/componentes e JavaScript leve.
- Endpoint PHP mínimo exclusivamente para o formulário de contato.
- Ativos locais otimizados.
- Estrutura simples para publicação em hospedagem estática.

### Alternativa para evolução rápida

- React com Vite, caso a landing page vá compartilhar componentes com o produto ou receba interações mais complexas em breve.

A decisão entre as opções deve ocorrer antes da implementação, evitando adicionar framework sem necessidade.

## 12. Plano de desenvolvimento em etapas

### Etapa 1 — Descoberta e conteúdo

**Entregáveis:** inventário de informações confirmadas, público prioritário, CTA oficial e texto revisado das seções.

**Critério de conclusão:** nenhum conteúdo essencial depende de suposição não identificada.

### Etapa 2 — Wireframe e fluxo

**Entregáveis:** wireframe mobile e desktop com hierarquia, ordem das seções e localização dos CTAs.

**Critério de conclusão:** a proposta de valor, os principais recursos e a ação desejada são encontrados rapidamente.

### Etapa 3 — Sistema visual

**Entregáveis:** paletas clara e escura, tipografia, espaçamentos, botões, cards, ícones e estados interativos.

**Critério de conclusão:** os componentes têm comportamento consistente e contraste validado nos dois temas.

### Etapa 4 — Implementação estrutural

**Entregáveis:** cabeçalho, hero, seções de conteúdo e rodapé com HTML semântico e responsividade base.

**Critério de conclusão:** toda a página funciona de 360 px a 1440 px sem quebra de layout.

### Etapa 5 — Interações e conversão

**Entregáveis:** menu móvel, alternância de tema, revelação progressiva dos cards, navegação suave, FAQ, formulário validado e links de contato configuráveis.

**Critério de conclusão:** interações funcionam com mouse, toque e teclado; preferência de tema é preservada; animações respeitam redução de movimento; formulário informa de modo acessível o resultado do envio real.

### Etapa 6 — Ativos e acabamento

**Entregáveis:** mockup, ilustrações/ícones, estados de foco, movimentos sutis e metadados sociais.

**Critério de conclusão:** nenhum ativo provisório ou texto ilustrativo aparece como dado real.

### Etapa 7 — Qualidade e publicação

**Entregáveis:** testes responsivos, revisão textual, auditoria Lighthouse, validação de links e checklist de publicação.

**Critério de conclusão:** requisitos de acessibilidade, desempenho, SEO e conteúdo desta especificação foram verificados ou registrados como exceção.

## 13. Backlog priorizado

### P0 — Obrigatório para o protótipo

- Estrutura responsiva completa.
- Hero com proposta de valor e CTA.
- Apresentação organizada dos módulos.
- Destaque para filiais e permissões.
- Benefícios por perfil.
- FAQ, contato e rodapé.
- Acessibilidade e SEO básicos.

### P1 — Recomendado antes da publicação

- Mockup realista do dashboard.
- Monitoramento de entrega e reforço anti-spam, se o volume justificar.
- Política de privacidade.
- Analytics com consentimento adequado.
- Imagem social personalizada.

### P2 — Evoluções

- Páginas detalhadas por módulo.
- Demonstração interativa.
- Planos e comparação comercial.
- Blog e materiais para líderes.
- Integração com CRM e automação de leads.

## 14. Critérios gerais de aceite do MVP

- A mensagem principal é compreendida sem depender de conhecimento prévio do produto.
- Todos os módulos informados nesta especificação aparecem na página.
- O diferencial de gestão de filiais e acessos limitados está explícito.
- Há CTA visível no início e no final da página.
- O layout é utilizável em celular, tablet e desktop.
- A página pode ser navegada por teclado e tem foco visível.
- Não há métricas, clientes, depoimentos ou garantias inventadas.
- O formulário não coleta dados sem destino e política definidos.
- Links, metadados, imagens e textos foram revisados antes da publicação.

## 15. Definição de pronto para cada tarefa

Uma tarefa só é considerada concluída quando:

1. Implementa o comportamento descrito.
2. Funciona nas larguras de referência.
3. Inclui estados normal, hover, foco e desabilitado quando aplicável.
4. É utilizável por teclado.
5. Não introduz erro no console nem link quebrado.
6. Foi revisada visualmente em celular e desktop.
7. Possui conteúdo final ou está claramente marcada como provisória.
