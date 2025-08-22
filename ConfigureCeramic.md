# Ceramic + IPFS con Docker Compose

Este README te guía desde cero para instalar Docker, levantar un nodo IPFS, Ceramic One y JS-Ceramic usando Docker Compose, y desplegar tus schemas de ComposeDB en tu backend.

---

## 1. Descargar e instalar Docker

1. Ve a https://docs.docker.com/get-docker/  
2. Sigue las instrucciones para tu sistema operativo  
3. Verifica la instalación:
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 2. Crear directorio de trabajo

Escoge una carpeta donde quieras tu proyecto y navega a ella:

```bash
mkdir -p ~/mi-proyecto-ceramic
cd ~/mi-proyecto-ceramic
```

---

## 3. Colocar archivos de configuración

Dentro de `~/mi-proyecto-ceramic`, crea:

```
mi-proyecto-ceramic/
├── daemon.config.json
├── docker-compose.yaml
└── composedb/
    └── models/
        └── schema.graphql
```

---

## 4. Contenido de `daemon.config.json`

```json
{
  "anchor": {
    "anchorServiceUrl": "inmemory://"
  },
  "http-api": {
    "hostname": "0.0.0.0",
    "port": 7007,
    "cors-allowed-origins": [".*"],
    "publish-api": true,
    "admin-dids": [
      "did:key:z6MkjhosnwwTDdcUkaqChV6BLNqZJ5vgLykxTqy83WyfJgUN"
    ]
  },
  "ipfs": {
    "mode": "remote",
    "host": "http://ipfs:5001",
    "enablePubsub": true
  },
  "network": { "name": "inmemory" },
  "node": {
    "private-seed-url": "inplace:ed25519#659fb6f92d8cd1bb972b15baf02b0d9620dbc771f323873f678f783209b72e0a"
  },
  "state-store": {
    "mode": "fs",
    "local-directory": "/root/.ceramic/statestore/"
  },
  "indexing": {
    "db": "sqlite:///root/.ceramic/indexing.sqlite",
    "allow-queries-before-historical-sync": true
  },
  "logger": { "log-level": 2, "log-to-files": false }
}
```

---

## 5. Contenido de `docker-compose.yaml`

```yaml
version: "3.9"

services:

  ipfs:
    image: ipfs/kubo:v0.18.1
    command: ["daemon", "--enable-pubsub-experiment"]
    volumes:
      - ipfs_data:/data/ipfs
    ports:
      - "4001:4001"
      - "5001:5001"
      - "8080:8080"
    healthcheck:
      test: ["CMD", "ipfs", "swarm", "peers"]
      interval: 10s
      timeout: 5s
      retries: 10

  ceramic_one:
    image: public.ecr.aws/r5b3e0r5/3box/ceramic-one:latest
    depends_on:
      ipfs:
        condition: service_healthy
    entrypoint:
      - ceramic-one
      - daemon
      - --network
      - in-memory
      - --bind-address
      - 0.0.0.0:5101
    volumes:
      - ceramicone_data:/root/.ceramic-one
    ports:
      - "5101:5101"
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:5101/api/v0/node/healthcheck || exit 1"]
      interval: 20s
      timeout: 10s
      retries: 20
      start_period: 70s

  js_ceramic:
    image: ceramicnetwork/js-ceramic:latest
    depends_on:
      ceramic_one:
        condition: service_started
      ipfs:
        condition: service_healthy
    command:
      - daemon
      - --config=/root/.ceramic/daemon.config.json
    environment:
      CERAMIC_NETWORK: "inmemory"
      CERAMIC_ENABLE_ADMIN_API: "true"
      CERAMIC_DID_PRIVATE_KEY: "659fb6f92d8cd1bb972b15baf02b0d9620dbc771f323873f678f783209b72e0a"
    volumes:
      - js_ceramic_data:/root/.ceramic
      - ./daemon.config.json:/root/.ceramic/daemon.config.json
    ports:
      - "7007:7007"
    restart: unless-stopped

volumes:
  ipfs_data:
  ceramicone_data:
  js_ceramic_data:
```

---

## 6. Descargar imágenes Docker

```bash
docker pull ipfs/kubo:v0.18.1
docker pull public.ecr.aws/r5b3e0r5/3box/ceramic-one:latest
docker pull ceramicnetwork/js-ceramic:latest
```

---

## 7. Levantar servicios con Docker Compose

```bash
docker compose up -d
```

Verifica que estén corriendo:

```bash
docker ps
```

- **ipfs** → puertos 4001, 5001, 8080  
- **ceramic_one** → puerto 5101  
- **js_ceramic** → puerto 7007  

---

## 8. Desplegar composites en tu backend

Desde la carpeta de tu backend (donde esté tu `package.json`):

1. **Crear el composite**:

   ```bash
   npx composedb composite:create      ./composedb/models/schema.graphql      --ceramic-url http://localhost:7007      -k 659fb6f92d8cd1bb972b15baf02b0d9620dbc771f323873f678f783209b72e0a      -o ./composedb/composites/composite.json
   ```

2. **Desplegar el composite**:

   ```bash
   npx composedb composite:deploy      ./composedb/composites/composite.json      --ceramic-url http://localhost:7007      -k 659fb6f92d8cd1bb972b15baf02b0d9620dbc771f323873f678f783209b72e0a
   ```

3. **Compilar el runtime**:

   ```bash
   npx composedb composite:compile      ./composedb/composites/composite.json      ./composedb/runtime/runtime.json
   ```
