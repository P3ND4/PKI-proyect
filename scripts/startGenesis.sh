#!/bin/bash

CHANNEL_NAME="mychannel"
CONFIG_PATH="./docker/fabric-config"

echo "Generando bloque génesis..."
configtxgen -profile GenesisProfile -channelID system-channel -outputBlock $CONFIG_PATH/genesis.block

echo "Bloque génesis generado con éxito."
