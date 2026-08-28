---
name: mensagem-commit
description: Encerrar ajustes com mensagem de commit copiável no padrão do projeto
trigger: always
---

# Mensagem para commit

Ao concluir qualquer ajuste de código (implementação, correção, refatoração ou reorganização), encerrar a resposta com a seção abaixo.

## Formato obrigatório

Sempre incluir, como último bloco da resposta, um heading `## Mensagem para commit` seguido de um bloco de código cercado (fenced code block) contendo apenas o texto da mensagem. Isso garante que o usuário consiga clicar no botão de copiar do bloco.

Estrutura:

````
## Mensagem para commit

```
<tipo>: <resumo objetivo em uma linha>.

<opcional: 1-3 bullets curtos com o essencial do que mudou>
```
````

## Padrão do projeto

- Idioma: português do Brasil.
- Tom: objetivo, direto, sem floreio.
- Foco no **porquê** e no **impacto**, não em lista de arquivos.
- Tipos comuns (ver tabela abaixo).

### Tipos comuns

| Tipo       | Quando usar                                                        |
|------------|--------------------------------------------------------------------|
| `feat`     | Nova funcionalidade ou comportamento adicionado ao sistema.        |
| `fix`      | Correção de bug ou comportamento inesperado.                       |
| `refactor` | Reestruturação de código sem alterar funcionalidade externa.       |
| `chore`    | Tarefas de manutenção (dependências, configs, CI, builds, etc.).   |
| `docs`     | Alteração exclusiva em documentação (README, comentários, etc.).   |
| `test`     | Adição ou ajuste de testes automatizados.                          |
| `style`    | Formatação, espaçamento ou lint — sem mudança de lógica.           |
| `perf`     | Melhoria de desempenho sem alterar funcionalidade.                 |
- Usar ponto final no resumo quando fizer sentido (como nos commits recentes do repositório).
- Não commitar automaticamente; apenas fornecer a mensagem pronta para copiar.
- Se houver múltiplas mudanças não relacionadas, sugerir commits separados.

## Exemplo

### Mensagem para commit

```
fix: Corrigir alerta de tracker Matomo duplicado na consulta pública.

- Unificar trackers em um único bloco com addTracker para site do parceiro.
- Mover analytics para v2/includes/analytics.php e atualizar includes.
```
