# Pyros Vision

Dashboard de monitoramento de queimadas para o estado de São Paulo. Combina dados de satélite da NASA FIRMS com detecção de fogo e fumaça por visão computacional (Roboflow) e leituras de sensores IoT (ESP32) em tempo real.

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Mapa** | Focos de calor ativos exibidos sobre mapa Mapbox com marcadores por nível de risco (CRÍTICO / ALERTA / MONITORANDO). Bases de drones clicáveis com informações de cobertura e risco médio. |
| **Câmeras** | Feed ao vivo da webcam com detecção de fogo e fumaça via WebSocket. Bounding boxes em tempo real e log de detecções. |
| **Focos** | Lista de focos ordenada por proximidade com dados de satélite (brilho, FRP, confiança, dia/noite). |
| **Frota** | Status da frota de drones — disponíveis, em missão e em manutenção — por base. |
| **Sensores** | Leituras de temperatura, umidade e fumaça de sensores ESP32 via WebSocket, com histórico em gráfico. |

## Stack

- **Next.js 16** + React 19 + TypeScript
- **Mapbox GL / react-map-gl** — mapas interativos com estilos customizados (claro e escuro)
- **Recharts** — gráficos de histórico dos sensores
- **Tailwind CSS v4** — utilitários de layout
- **WebSocket** — atualizações em tempo real para câmera e sensores

## Pré-requisitos

- Node.js 20+
- Token de acesso do [Mapbox](https://account.mapbox.com/)
- Backend Pyros rodando (expõe `/api/focos`, `/api/drones`, `/api/sensores`, `/ws/camera`, `/ws/sensores`)

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.seu_token_aqui
```

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Build de produção

```bash
npm run build
npm start
```

## Estrutura

```
app/
  layout.tsx          # Providers globais (tema, fontes)
  page.tsx            # Página principal — mapa + painéis
  cameras/            # Feed ao vivo + detecção
  focos/              # Lista de focos de calor
  frota/              # Gestão da frota de drones
  sensores/           # Leituras dos sensores IoT

components/
  Mapa.tsx            # Mapa Mapbox principal
  FocosMapa.tsx       # Camada de focos sobre o mapa
  BasesDronesMapa.tsx # Camada de bases de drones
  CameraView.tsx      # Feed de câmera com bounding boxes
  GraficoHistorico.tsx # Gráfico Recharts para sensores
  Header.tsx          # Navegação flutuante com relógio

lib/
  api.ts              # Funções fetch + tipos TypeScript da API
```

## API esperada

O frontend consome os seguintes endpoints do backend:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/focos` | GET | Lista de focos de calor com nível geral |
| `/api/drones` | GET | Status da frota de drones |
| `/api/sensores` | GET | Histórico de leituras dos sensores |
| `/api/sensores/ultimo` | GET | Última leitura disponível |
| `/api/analisar` | POST | Análise de imagem por visão computacional |
| `/ws/camera` | WS | Stream bidirecional: envia frames JPEG, recebe detecções |
| `/ws/sensores` | WS | Stream unidirecional: leituras em tempo real |
