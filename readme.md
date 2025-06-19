
# Baileys API

Baileys é uma biblioteca TypeScript baseada em WebSockets para interagir com a API Web do WhatsApp.

## Requisitos
- NodeJS versão 18.19.0 ou superior (Versão recomendada 20 e superior)

## Instalação
1. Primeiro instale a versão mais recente do [Baileys](https://www.npmjs.com/package/baileys)
2. Instale as dependências
```bash
  npm install
```

## Utilização
1. Certifique-se de ter concluído a etapa de instalação e configuração do projeto
2. Você pode então iniciar o aplicativo usando o `dev` para desenvolvimento
```use
# Desenvolvimento
npm run dev
```

## Documentação da API

#### Realiza o envio de mensagem para o número desejado

```http
  POST /api/v1/message
```

| Parâmetro   | Tipo       | Descrição                           |
| :---------- | :--------- | :---------------------------------- |
| `contact` | `string` | Número de contato que deseja enviar a mensagem. |
| `message` | `string` | Mensagem que deseja enviar. |