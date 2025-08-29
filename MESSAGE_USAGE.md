# Guia de Uso - Sistema de Envio de Mensagens WhatsApp

## Visão Geral
O sistema foi atualizado para suportar tanto envio de mensagens para números individuais quanto para grupos do WhatsApp. **Agora o backend busca automaticamente o ID do grupo baseado no nome fornecido pelo usuário!**

## Formato dos Contatos

### Números Individuais
- **Formato**: Apenas números (ex: `5511999999999`)
- **Sistema**: Automaticamente formatado para `5511999999999@s.whatsapp.net`
- **Exemplo de uso**:
```json
{
  "name": "Lucas",
  "sessionId": "session123",
  "contact": "5511999999999",
  "message": "Olá! Como vai?"
}
```

### Grupos
- **Formato**: **Nome do grupo** (ex: `Familia`, `Trabalho`, `Meu Grupo`)
- **Sistema**: **Automaticamente busca o ID do grupo e formata para `ID_DO_GRUPO@g.us`**
- **Exemplo de uso**:
```json
{
  "name": "Lucas",
  "sessionId": "session123",
  "contact": "Familia",
  "message": "Bom dia a todos!"
}
```

### Contatos Já Formatados
- **Números**: Se você já enviar `5511999999999@s.whatsapp.net`, será usado como está
- **Grupos**: Se você já enviar `120363025123456789@g.us`, será usado como está

## Como Funciona a Busca Automática de Grupos

1. **Usuário envia**: `"contact": "Familia"`
2. **Backend busca**: Todos os grupos em que o bot participa
3. **Backend encontra**: Grupo com nome "Familia" → ID: `120363025123456789`
4. **Backend formata**: `120363025123456789@g.us`
5. **Backend envia**: Mensagem para o grupo encontrado

## Endpoints

### 1. Envio Individual
**POST** `/message`

**Body:**
```json
{
  "name": "string",
  "sessionId": "string", 
  "contact": "string",
  "message": "string"
}
```

**Resposta de Sucesso:**
```json
{
  "code": 200,
  "success": true,
  "message": "Mensagem enviada com sucesso",
  data: {
    "to": "Familia",
    "formattedTo": "120363025123456789@g.us",
    "message": "Bom dia!",
    "type": "embed_message",
    "contactType": "group",
    "sended_at": "2024-01-01T10:00:00.000Z"
  }
}
```

### 2. Envio em Blocos
**POST** `/message/blocks`

**Body:**
```json
{
  "name": "string",
  "sessionId": "string",
  "block": [
    {
      "contact": "5511999999999",
      "message": "Mensagem para número individual"
    },
    {
      "contact": "Familia",
      "message": "Mensagem para grupo"
    }
  ]
}
```

### 3. Listar Grupos Disponíveis
**POST** `/groups`

**Body:**
```json
{
  "name": "string",
  "sessionId": "string"
}
```

**Resposta:**
```json
{
  "code": 200,
  "success": true,
  "message": "Grupos encontrados com sucesso",
  "data": {
    "total": 3,
    "groups": [
      {
        "id": "120363025123456789",
        "name": "Familia",
        "participants": 15,
        "admins": 3
      },
      {
        "id": "120363025987654321",
        "name": "Trabalho",
        "participants": 8,
        "admins": 2
      }
    ]
  }
}
```

## Lógica de Formatação Automática

O sistema usa a seguinte lógica para determinar o tipo de contato:

1. **Se contém `@s.whatsapp.net` ou `@g.us`**: Usa o formato enviado
2. **Se contém apenas números**: Formata como número individual (`@s.whatsapp.net`)
3. **Se contém letras/caracteres especiais**: **Busca automaticamente o grupo por nome**

## Busca Inteligente de Grupos

### Como Funciona
- **Busca case-insensitive**: "familia", "Familia", "FAMILIA" funcionam
- **Busca parcial**: "Fam" encontrará "Familia", "Família", etc.
- **Logs detalhados**: Mostra o processo de busca no console

### Exemplo de Logs
```
🔍 Tentando buscar grupo com nome: "Familia"
🔍 Buscando grupo com nome: "Familia"
✅ Grupo encontrado: "Familia" (ID: 120363025123456789)
```

## Validações

O sistema agora inclui validações para:
- **Grupos existentes**: Verifica se o grupo foi encontrado antes de tentar enviar
- **Números individuais**: Valida formato de números
- **Sessões ativas**: Verifica se o bot está conectado

## Logs de Debug

O sistema inclui logs para facilitar o debug:
- 🔍 Processo de busca de grupos
- ✅ Grupos encontrados com sucesso
- ❌ Grupos não encontrados
- 📱 Tipo de contato (Grupo ou Individual)
- ✅ Confirmação de envio bem-sucedido
- ❌ Detalhes de erros com o contato que falhou

## Exemplos Práticos

### Enviar para número
```bash
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lucas",
    "sessionId": "session123",
    "contact": "5511999999999",
    "message": "Teste de mensagem"
  }'
```

### Enviar para grupo (por nome!)
```bash
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lucas",
    "sessionId": "session123",
    "contact": "Familia",
    "message": "Bom dia família!"
  }'
```

### Listar grupos disponíveis
```bash
curl -X POST http://localhost:3000/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lucas",
    "sessionId": "session123"
  }'
```

## Notas Importantes

- **Grupos**: O bot deve estar no grupo para poder enviar mensagens
- **Nomes de grupos**: Use nomes exatos ou similares (o sistema é inteligente!)
- **Números**: Devem estar no formato internacional (ex: 5511999999999)
- **Sessões**: Mantenha as sessões ativas para envio contínuo
- **Rate Limiting**: O sistema inclui delay de 10 segundos para envios em blocos

## Vantagens da Nova Implementação

✅ **Usuário não precisa saber IDs**: Apenas o nome do grupo
✅ **Busca automática**: Backend resolve tudo
✅ **Flexibilidade**: Aceita nomes similares
✅ **Logs detalhados**: Fácil debug
✅ **Validação inteligente**: Previne erros
✅ **Endpoint de grupos**: Lista todos os grupos disponíveis
