#!/bin/bash

# Variables
CHANNEL_NAME="mychannel"
ORDERER_GENESIS="genesis.block"
CHANNEL_TX="mychannel.tx"
CHANNEL_BLOCK="mychannel.block"

# Rutas de herramientas
FABRIC_CFG_PATH=${PWD}
CRYPTO_PATH="./crypto-config"

# Limpieza previa
echo "Limpiando archivos previos..."
rm -rf ${ORDERER_GENESIS} ${CHANNEL_TX} ${CHANNEL_BLOCK} ./crypto-config

# Paso 1: Crear estructura de carpetas para certificados
echo "Creando estructura de carpetas para certificados..."
mkdir -p ${CRYPTO_PATH}/peerOrganizations/org1.example.com/msp/cacerts
mkdir -p ${CRYPTO_PATH}/peerOrganizations/org1.example.com/msp/signcerts
mkdir -p ${CRYPTO_PATH}/peerOrganizations/org1.example.com/msp/keystore
mkdir -p ${CRYPTO_PATH}/peerOrganizations/org1.example.com/tls

echo "NOTA: Asegúrate de copiar los certificados generados por tu CA externa en las carpetas correspondientes:"
echo "  - Certificado raíz (CA) en ${CRYPTO_PATH}/peerOrganizations/org1.example.com/msp/cacerts/"
echo "  - Certificado TLS en ${CRYPTO_PATH}/peerOrganizations/org1.example.com/tls/"
read -p "Presiona Enter para continuar una vez que hayas copiado los certificados..."

# Paso 2: Generar artefactos de configuración
echo "Generando artefactos de configuración con configtxgen..."

# Archivo genesis.block
configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock ${ORDERER_GENESIS}
if [ $? -ne 0 ]; then
    echo "Error al generar el bloque génesis."
    exit 1
fi

# Archivo mychannel.tx
configtxgen -profile Channel -outputCreateChannelTx ${CHANNEL_TX} -channelID ${CHANNEL_NAME}
if [ $? -ne 0 ]; then
    echo "Error al generar la transacción del canal."
    exit 1
fi

echo "Artefactos generados exitosamente."

# Paso 3: Crear docker-compose.yaml
echo "Creando archivo docker-compose.yaml..."
cat > docker-compose.yaml <<EOL
version: '3.8'

services:
  orderer.example.com:
    image: hyperledger/fabric-orderer:2.5
    container_name: orderer.example.com
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/orderer/msp
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_CERTIFICATE=/etc/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/etc/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_ROOTCAS=[/etc/hyperledger/orderer/tls/ca.crt]
    volumes:
      - ./crypto-config/ordererOrganizations/example.com:/etc/hyperledger/orderer
      - ./genesis.block:/etc/hyperledger/orderer/genesis.block
    ports:
      - "7050:7050"

  peer0.org1.example.com:
    image: hyperledger/fabric-peer:2.5
    container_name: peer0.org1.example.com
    environment:
      - CORE_PEER_ID=peer0.org1.example.com
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peer/msp
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/peer/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/peer/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/peer/tls/ca.crt
    volumes:
      - ./crypto-config/peerOrganizations/org1.example.com:/etc/hyperledger/peer
    ports:
      - "7051:7051"

networks:
  default:
    name: fabric-network
EOL

echo "Archivo docker-compose.yaml creado exitosamente."

# Paso 4: Levantar contenedores con Docker Compose
echo "Levantando contenedores con Docker Compose..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "Error al levantar los contenedores."
    exit 1
fi

echo "Contenedores levantados exitosamente."

# Paso 5: Crear el canal
echo "Creando el canal '${CHANNEL_NAME}'..."
docker exec -it peer0.org1.example.com peer channel create \
    -o orderer.example.com:7050 \
    -c ${CHANNEL_NAME} \
    -f /etc/hyperledger/peer/${CHANNEL_TX} \
    --outputBlock /etc/hyperledger/peer/${CHANNEL_BLOCK} \
    --tls \
    --cafile /etc/hyperledger/peer/tls/ca.crt

if [ $? -ne 0 ]; then
    echo "Error al crear el canal."
    exit 1
fi

echo "Canal '${CHANNEL_NAME}' creado exitosamente."

# Paso 6: Unir el Peer al canal
echo "Uniendo el Peer al canal '${CHANNEL_NAME}'..."
docker exec -it peer0.org1.example.com peer channel join \
    -b /etc/hyperledger/peer/${CHANNEL_BLOCK}

if [ $? -ne 0 ]; then
    echo "Error al unir el Peer al canal."
    exit 1
fi

echo "Peer unido al canal '${CHANNEL_NAME}' exitosamente."
