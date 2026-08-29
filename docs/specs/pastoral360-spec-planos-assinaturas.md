# Spec — Planos, Assinaturas e Regras de Negócio do Pastoral 360

## 1. Objetivo

Implementar no Pastoral 360 uma estrutura flexível de planos e assinaturas, permitindo controlar:

- planos comerciais;
- funcionalidades disponíveis por plano;
- limites de utilização;
- período de teste;
- adicionais;
- ofertas promocionais;
- preço contratado;
- status da assinatura;
- acesso aos módulos do sistema;
- futuras integrações com meios de pagamento.

A implementação deve evitar regras fixas espalhadas pelo código, permitindo alterar planos e permissões por configuração administrativa.

---

## 2. Planos disponíveis

Devem existir inicialmente os seguintes planos:

| Código | Nome | Mensal | Anual |
|---|---|---:|---:|
| `GRATUITO` | Gratuito | R$ 0,00 | R$ 0,00 |
| `ESSENCIAL` | Essencial | R$ 49,90 | R$ 499,00 |
| `GESTAO` | Gestão | R$ 79,90 | R$ 799,00 |
| `COMPLETO` | Completo | R$ 129,90 | R$ 1.299,00 |
| `MULTI` | Multi-Igrejas | R$ 199,90 | R$ 1.999,00 |

O plano `GESTAO` deve ser marcado inicialmente como plano em destaque.

---

## 3. Funcionalidades

As funcionalidades devem ser cadastradas independentemente dos planos.

Sugestão inicial de códigos:

- `membros`
- `visitantes`
- `secretaria`
- `financeiro`
- `eventos`
- `departamentos`
- `ebd`
- `pequenos_grupos`
- `patrimonio`
- `novos_convertidos`
- `batismos`
- `relatorios_avancados`
- `site_publico`
- `multi_igreja`
- `relatorios_consolidados`

Cada plano deve possuir uma relação própria com suas funcionalidades.

### Regra

O sistema não deve utilizar verificações fixas como:

```php
if ($plano === 'GESTAO') {
    // libera recurso
}
```

Deve utilizar uma verificação baseada na funcionalidade:

```php
$igreja->assinatura->permite('ebd');
```

Assim, uma funcionalidade poderá ser adicionada ou removida de um plano sem alteração no código da regra de acesso.

---

## 4. Funcionalidades por plano

| Funcionalidade | Gratuito | Essencial | Gestão | Completo | Multi |
|---|:---:|:---:|:---:|:---:|:---:|
| Membros | Sim | Sim | Sim | Sim | Sim |
| Visitantes | Sim | Sim | Sim | Sim | Sim |
| Secretaria | Básico | Sim | Sim | Sim | Sim |
| Financeiro | Não | Sim | Sim | Sim | Sim |
| Eventos | Sim | Sim | Sim | Sim | Sim |
| Departamentos | Não | Não | Sim | Sim | Sim |
| EBD | Não | Não | Sim | Sim | Sim |
| Pequenos grupos | Não | Não | Sim | Sim | Sim |
| Patrimônio | Não | Não | Sim | Sim | Sim |
| Novos convertidos | Não | Não | Sim | Sim | Sim |
| Batismos | Não | Não | Sim | Sim | Sim |
| Relatórios avançados | Não | Não | Sim | Sim | Sim |
| Site público | Não | Não | Não | Sim | Sim |
| Multi-Igrejas | Não | Não | Não | Não | Sim |
| Relatórios consolidados | Não | Não | Não | Não | Sim |

---

## 5. Limites por plano

Os limites devem ser armazenados separadamente das funcionalidades.

| Limite | Gratuito | Essencial | Gestão | Completo | Multi |
|---|---:|---:|---:|---:|---:|
| Membros | 100 | Ilimitado | Ilimitado | Ilimitado | Ilimitado |
| Usuários administrativos | 1 | 3 | 8 | 20 | 30 |
| Unidades | 1 | 1 | 1 | 1 | 4 |
| Armazenamento | 100 MB | 500 MB | 2 GB | 5 GB | 10 GB |

### Regra para limite ilimitado

Quando um limite for ilimitado, o valor deve ser armazenado como `NULL`.

Não utilizar números artificiais, como `999999`, para representar ilimitado.

---

## 6. Período de teste

Ao criar uma nova igreja, o sistema deve permitir iniciar um período de teste de 30 dias.

Configuração inicial sugerida:

```text
status: trial
plano: COMPLETO
trial_termina_em: data atual + 30 dias
```

Durante o período de teste:

- disponibilizar os recursos do plano Completo;
- exibir no painel a quantidade de dias restantes;
- permitir contratação de um plano a qualquer momento;
- não exigir cartão de crédito para iniciar o teste.

Ao final do período de teste, caso não exista contratação:

- bloquear os recursos pagos;
- apresentar a tela de escolha de plano;
- preservar os dados cadastrados;
- não excluir automaticamente informações da igreja.

---

## 7. Status da assinatura

A assinatura deve possuir um dos seguintes status:

- `trial`
- `ativa`
- `inadimplente`
- `suspensa`
- `cancelada`
- `cortesia`

### Regras gerais

#### trial

Assinatura dentro do período gratuito.

#### ativa

Assinatura paga e regular.

#### inadimplente

Existe cobrança vencida, mas a igreja ainda está dentro do período de tolerância.

#### suspensa

Acesso aos recursos pagos temporariamente bloqueado.

#### cancelada

Assinatura encerrada pelo cliente ou pela administração.

#### cortesia

Assinatura liberada manualmente, sem necessidade de cobrança.

---

## 8. Preço contratado

O valor efetivamente contratado deve ser armazenado na própria assinatura.

Exemplo:

```text
Plano atual: GESTAO
Preço atual do plano: R$ 79,90
Preço contratado pelo cliente: R$ 59,90
```

Essa regra permite:

- manter preços promocionais;
- criar campanhas para clientes fundadores;
- reajustar preços para novos clientes;
- preservar o preço de clientes antigos;
- registrar negociações comerciais específicas.

Alterações futuras no preço padrão do plano não devem modificar automaticamente o valor já contratado.

---

## 9. Ciclo de cobrança

A assinatura deve permitir inicialmente:

- `mensal`
- `anual`

Campos recomendados:

- valor contratado;
- data de início;
- próxima cobrança;
- data final do trial;
- data de cancelamento;
- ciclo de cobrança.

---

## 10. Adicionais

Os adicionais devem ser cadastrados separadamente dos planos.

Exemplos iniciais:

### Unidade adicional

Código:

```text
UNIDADE_ADICIONAL
```

Valor sugerido:

```text
R$ 39,90/mês
```

Efeito:

```text
limite_unidades + quantidade contratada
```

### Usuários adicionais

Código sugerido:

```text
USUARIOS_5
```

Efeito:

```text
limite_usuarios + 5 por quantidade contratada
```

### Armazenamento adicional

Código sugerido:

```text
STORAGE_5GB
```

Efeito:

```text
limite_armazenamento + 5 GB por quantidade contratada
```

Novos adicionais devem poder ser cadastrados sem criação de um novo plano.

---

## 11. Ofertas e promoções

Plano e oferta devem ser entidades distintas.

Exemplo de oferta:

```text
Código: FUNDADORES2026
Plano: GESTAO
Preço mensal: R$ 59,90
Quantidade máxima: 30 assinaturas
Validade: configurável
Manter preço enquanto assinatura estiver ativa: sim
```

Ofertas futuras podem incluir:

- desconto no primeiro ano;
- campanhas de indicação;
- promoções sazonais;
- descontos para convenções ou ministérios;
- condições comerciais específicas.

A oferta deve definir uma condição comercial, mas a assinatura resultante continua vinculada ao plano normal.

---

## 12. Estrutura de dados sugerida

### planos

Campos:

```text
id
codigo
nome
descricao
preco_mensal
preco_anual
ativo
destaque
ordem
created_at
updated_at
```

### funcionalidades

Campos:

```text
id
codigo
nome
descricao
ativo
created_at
updated_at
```

### plano_funcionalidades

Campos:

```text
plano_id
funcionalidade_id
```

Criar restrição única para:

```text
plano_id + funcionalidade_id
```

### plano_limites

Campos:

```text
id
plano_id
codigo
valor
created_at
updated_at
```

Criar restrição única para:

```text
plano_id + codigo
```

### assinaturas

Campos:

```text
id
igreja_id
plano_id
oferta_id
status
ciclo
valor_contratado
inicio_em
trial_termina_em
proxima_cobranca_em
cancelada_em
created_at
updated_at
```

### adicionais

Campos:

```text
id
codigo
nome
descricao
preco_mensal
preco_anual
ativo
created_at
updated_at
```

### assinatura_adicionais

Campos:

```text
id
assinatura_id
adicional_id
quantidade
valor_unitario
created_at
updated_at
```

### ofertas

Campos sugeridos:

```text
id
codigo
nome
plano_id
preco_mensal
preco_anual
quantidade_maxima
inicio_em
fim_em
manter_preco
ativo
created_at
updated_at
```

---

## 13. Regra de acesso aos módulos

Antes de liberar um recurso, o sistema deve verificar:

1. se a igreja possui assinatura válida;
2. se o status permite utilização;
3. se o plano possui a funcionalidade solicitada;
4. se os limites contratados não foram excedidos.

Fluxo sugerido:

```text
Usuário acessa módulo
        |
        v
Existe assinatura?
        |
        v
Status permite acesso?
        |
        v
Plano possui funcionalidade?
        |
        v
Limite foi atingido?
        |
        v
Permitir ou bloquear acesso
```

---

## 14. Comportamento ao atingir limites

O sistema não deve excluir dados automaticamente.

Exemplo para usuários administrativos:

```text
Plano permite: 3 usuários
Usuários cadastrados: 3
```

Ao tentar cadastrar o quarto usuário:

```text
Você atingiu o limite de usuários do seu plano.
Faça upgrade ou contrate usuários adicionais.
```

O mesmo comportamento deve ser aplicado aos demais limites.

---

## 15. Downgrade

Antes de permitir downgrade, verificar se a utilização atual é compatível com o novo plano.

Exemplo:

```text
Plano atual: Gestão
Usuários cadastrados: 7
Novo plano: Essencial
Limite do Essencial: 3
```

O sistema deve informar que o downgrade somente poderá ser concluído após adequação dos limites ou contratação de adicional compatível.

Dados de módulos indisponíveis após downgrade não devem ser excluídos.

Eles devem permanecer armazenados, porém indisponíveis para edição ou acesso conforme a regra definida pelo produto.

---

## 16. Upgrade

Upgrade deve liberar imediatamente:

- novas funcionalidades;
- novos limites;
- adicionais previstos no novo plano.

A política financeira de cobrança proporcional poderá ser definida posteriormente junto à integração com o gateway de pagamento.

---

## 17. Área administrativa

Criar área administrativa:

```text
Administração
└── Planos e Assinaturas
```

Subseções sugeridas:

### Planos

Permitir:

- cadastrar;
- editar;
- ativar/desativar;
- definir preços;
- definir destaque;
- configurar ordem de exibição.

### Funcionalidades

Permitir:

- cadastrar recursos;
- ativar/desativar;
- associar funcionalidades aos planos.

### Limites

Permitir definir limites por plano.

### Adicionais

Permitir cadastrar e alterar adicionais.

### Ofertas

Permitir criar campanhas e condições promocionais.

### Assinaturas

Exibir pelo menos:

- igreja;
- plano;
- status;
- ciclo;
- valor contratado;
- início;
- fim do trial;
- próxima cobrança.

---

## 18. Regras de segurança

As regras de autorização devem ser aplicadas no backend.

Não confiar apenas em:

- esconder menus;
- esconder botões;
- bloquear telas via JavaScript.

Mesmo que o menu não esteja visível, qualquer rota ou endpoint protegido deve validar a assinatura antes de executar a ação.

---

## 19. Separação entre assinatura e pagamento

O módulo de planos e assinaturas não deve depender diretamente de um gateway específico.

A arquitetura deve permitir futuras integrações com serviços como:

- Mercado Pago;
- Asaas;
- Stripe;
- outros provedores.

O gateway será responsável por cobrança e eventos financeiros.

O Pastoral 360 continuará responsável por:

- plano;
- funcionalidades;
- limites;
- status;
- permissões;
- adicionais;
- ofertas.

---

## 20. Critérios de aceite

A implementação será considerada funcional quando:

- for possível cadastrar e editar planos;
- cada plano puder possuir funcionalidades próprias;
- cada plano puder possuir limites próprios;
- uma igreja puder possuir uma assinatura;
- o sistema reconhecer os status da assinatura;
- o trial de 30 dias funcionar;
- funcionalidades forem bloqueadas conforme o plano;
- limites forem validados no backend;
- preço contratado ficar preservado;
- adicionais puderem aumentar limites;
- ofertas puderem alterar condições comerciais sem criar novos planos;
- upgrade e downgrade respeitarem as regras definidas;
- dados não forem excluídos automaticamente por mudança de plano;
- a solução não depender de um gateway de pagamento específico.

---

## 21. Estrutura conceitual

```text
PASTORAL 360
│
├── PLANOS
│   ├── Gratuito
│   ├── Essencial
│   ├── Gestão
│   ├── Completo
│   └── Multi-Igrejas
│
├── FUNCIONALIDADES
│
├── LIMITES
│
├── ADICIONAIS
│
├── OFERTAS
│
└── ASSINATURAS
    ├── Trial
    ├── Ativa
    ├── Inadimplente
    ├── Suspensa
    ├── Cancelada
    └── Cortesia
```
