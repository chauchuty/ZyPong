# ZyPong

Jogo de ping-pong PWA em português, responsivo, com adversário em três níveis, partidas até 7 pontos, toque/mouse/teclado, pausa automática, áudio opcional e contador local de vitórias. Sem dependências de produção, contas, anúncios ou coleta de dados.

## Desenvolvimento

Pré-requisitos: Python 3 para o servidor local; Node.js 18+ para os testes.

```sh
cd /workspace/ZyPong
npm start
# Em outro terminal:
npm test
```

Abra a porta 8080 no seu navegador local. Gire o celular para o modo paisagem. Arraste verticalmente para mover a raquete azul à esquerda, ou use as setas cima/baixo (ou W/S) com o campo focado. Ao iniciar, o jogo tenta ativar tela cheia e bloquear a orientação em paisagem. Quando a API não é suportada, gire o dispositivo manualmente; a arena continua ocupando toda a área disponível. Voltar ao retrato ou sair da tela cheia pausa a partida. Escape ou espaço pausa; o botão Continuar retoma. O PWA precisa de HTTPS em produção; localhost é aceito para desenvolvimento. Depois da primeira visita, aguarde a instalação do service worker antes de usar offline. O botão Instalar aparece quando o navegador disponibiliza essa opção; também é possível usar o menu de instalação do navegador.

## Publicar no Render (onrender.com)

1. Envie estes arquivos para a branch `main` de `chauchuty/ZyPong`.
2. No Render, escolha **New → Static Site**, conecte o repositório e selecione `main`.
3. Deixe **Root Directory** vazio, use `echo "Static site ready"` em **Build Command** e `.` em **Publish Directory**. Não configure Start Command, variáveis ou banco de dados.
4. Faça o deploy. O Render fornecerá um endereço HTTPS `https://<nome-escolhido>.onrender.com`. O nome depende da disponibilidade.
5. Alternativamente, crie um **Blueprint** usando `render.yaml`, que também configura o cabeçalho sem cache de `sw.js`. Se criar manualmente, adicione `Cache-Control: no-cache` para `/sw.js` nas configurações de Headers.
6. No endereço final, teste jogar uma partida, instalar, fechar/reabrir e recarregar com a rede desligada após o primeiro carregamento completo. O service worker não depende de domínio fixo.

Ao alterar os arquivos estáticos, altere a versão de `CACHE` no `sw.js` para renovar o conjunto offline. Feche todas as janelas do jogo e reabra para ativar uma atualização pendente.

## Google Play Store

Este repositório contém o jogo web/PWA; ainda não contém um aplicativo Android assinado ou AAB. Publicar no Render não publica automaticamente na Play Store.

Depois de definir o domínio HTTPS definitivo:

1. Gere um projeto Android **Trusted Web Activity** com Bubblewrap (ou outra ferramenta compatível), usando o manifesto hospedado em `/manifest.webmanifest`. Use sua própria identificação de pacote definitiva, por exemplo `com.seunome.zypong`.
2. Configure assinatura e gere o Android App Bundle (AAB). Guarde a chave de upload fora do repositório. Use o nível de API exigido atualmente pelo Google Play.
3. Configure **Play App Signing**. Publique `/.well-known/assetlinks.json` no site com o nome real do pacote e a impressão SHA-256 do certificado de assinatura do aplicativo fornecido pelo Play Console. Não use uma impressão inventada ou apenas o certificado da chave de upload. Sem associação válida, a TWA poderá mostrar a interface do navegador.
4. Cadastre o app no Play Console, faça os testes exigidos para sua conta e prepare ícone de loja, screenshots, classificação etária, público-alvo e declarações de segurança de dados. Os ícones PWA incluídos não substituem todos os materiais da loja.
5. Revise e publique uma política de privacidade em URL pública estável. O texto em `privacy.html` descreve esta versão sem coleta de dados; atualize-o caso adicione anúncios, analytics ou outros SDKs.

O empacotamento Android depende do domínio final, da identidade do pacote e dos certificados do proprietário. A submissão e a aprovação na loja são etapas posteriores.

## Validação

`npm test` cobre física e pontuação. Testes de navegador devem conferir início, controle por toque, pausa/retomada, layout móvel, erros de console e carregamento offline. `render.yaml` publica os arquivos diretamente, sem etapa de compilação.

As imagens do ZIP em `store-assets/` mostram a versão visual anterior. Atualize as capturas da loja antes de publicar a versão neon em paisagem. O manifesto agora pede `display: fullscreen` e `orientation: landscape`; o pacote TWA existente pode precisar ser regenerado para refletir essas opções.
