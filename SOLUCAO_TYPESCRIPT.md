# Solução para Problemas de TypeScript com sock.user

## Problema Identificado

O TypeScript estava gerando erros como:

```
"sock.user" is possibly "undefined"
const botParticipant = participants.participants.find(p => p.id === sock.user.id)
```

## Causa do Problema

O TypeScript não consegue garantir que `sock.user` não seja `undefined` mesmo após verificações de tipo, especialmente em funções assíncronas e callbacks.

## Solução Implementada

### 1. Uso do Operador de Encadeamento Opcional (`?.`)

```typescript
// ❌ Antes (causava erro)
if (!sock.user || !sock.user.id) {
    return null;
}

// ✅ Depois (correto)
if (!sock.user?.id) {
    return null;
}
```

### 2. Captura do ID em Variável Local

```typescript
// ❌ Antes (causava erro)
const botParticipant = participants.participants.find(p => p.id === sock.user.id);

// ✅ Depois (correto)
if (!sock.user?.id) {
    return null;
}

const userId = sock.user.id; // Captura o ID para usar depois
const botParticipant = participants.participants.find(p => p.id === userId);
```

## Arquivos Corrigidos

### 1. `src/services/baileys/group.ts`

```typescript
export const findGroupByName = async (sock: WASocket, groupName: string): Promise<string | null> => {
    try {
        // Verifica se o socket está conectado
        if (!sock.user?.id) {
            console.log(`❌ Socket não está autenticado`);
            return null;
        }
        
        const userId = sock.user.id; // Captura o ID para usar depois
        
        // ... resto do código usando userId
        const botParticipant = foundGroup.participants.find(p => p.id === userId);
    }
};
```

### 2. `src/utils/sessionManager.ts`

```typescript
export const cleanupInactiveSessions = async () => {
    for (const [key, sock] of sessions.entries()) {
        if (!sock || !sock.user?.id) {
            keysToRemove.push(key);
            continue;
        }
        
        try {
            await sock.presenceSubscribe(sock.user.id);
        } catch (error) {
            // ... tratamento de erro
        }
    }
};
```

### 3. `src/services/baileys/message.ts`

```typescript
export const sendMessage = async (
    name: string,
    session: string,
    contact: string,
    message: string
): Promise<SendMessageResult> => {
    try {
        // Verifica se o socket ainda está válido
        if (!sock.user?.id) {
            return { success: false, error: 'Socket inválido ou não autenticado.' };
        }

        const userId = sock.user.id; // Captura o ID para usar depois
        
        // ... resto do código usando userId
        const botParticipant = participants.participants.find(p => p.id === userId);
    }
};
```

## Padrão Recomendado

### Para Verificações de Tipo

```typescript
// ✅ Sempre use o operador de encadeamento opcional
if (!sock.user?.id) {
    return null; // ou throw new Error()
}
```

### Para Uso Posterior

```typescript
// ✅ Capture o valor em uma variável local
const userId = sock.user.id;

// ✅ Use a variável local em vez de acessar sock.user.id repetidamente
const botParticipant = participants.find(p => p.id === userId);
```

### Para Filtros e Arrays

```typescript
// ✅ Use o operador de encadeamento opcional em filtros
active: Array.from(sessions.values()).filter(sock => sock && sock.user?.id).length
```

## Benefícios da Solução

1. **Elimina erros de TypeScript** relacionados a `sock.user` sendo `undefined`
2. **Melhora a legibilidade** do código
3. **Reduz acessos repetidos** a `sock.user.id`
4. **Mantém a segurança de tipos** do TypeScript
5. **Facilita a manutenção** do código

## Verificação de Compilação

Após aplicar as correções, execute:

```bash
# Se estiver usando npm
npm run build

# Se estiver usando yarn
yarn build

# Ou compile o TypeScript diretamente
npx tsc --noEmit
```

## Prevenção de Problemas Futuros

1. **Sempre use `?.`** para acessar propriedades opcionais
2. **Capture valores em variáveis locais** quando precisar usá-los múltiplas vezes
3. **Faça verificações de tipo** no início das funções
4. **Use interfaces TypeScript** para definir tipos mais precisos
5. **Configure o TypeScript** para ser mais rigoroso com tipos opcionais

## Exemplo de Interface Recomendada

```typescript
interface AuthenticatedSocket extends WASocket {
    user: {
        id: string;
        name?: string;
        // outras propriedades...
    };
}

// Uso
export const sendMessage = async (sock: AuthenticatedSocket, ...) => {
    // Agora sock.user.id é garantidamente uma string
    const userId = sock.user.id;
};
```

Com essas correções, todos os erros de TypeScript relacionados ao `sock.user` devem ser resolvidos.
