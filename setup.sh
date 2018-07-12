echo "[*] Upgrading the system"
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install -y apt-transport-https git make dirmngr

echo "[*] Cloning lora_gateway software"
cd /usr/share
if [ ! -d "lora_gateway" ] ; then
  sudo git clone https://github.com/bogdanoniga/lora_gateway.git
fi
sudo chmod -R 777 /usr/share/lora_gateway && cd /usr/share/lora_gateway

echo "[*] Installing LoRa Gateway Bridge"
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 1CE2AFD36DBCCA00

sudo echo "deb https://artifacts.loraserver.io/packages/1.x/deb stable main" | sudo tee /etc/apt/sources.list.d/loraserver.list
sudo apt-get update

sudo apt-get install -y lora-gateway-bridge

sudo mv ./configs/lora-gateway-bridge.toml /etc/lora-gateway-bridge/lora-gateway-bridge.toml
sudo chmod 777 /etc/lora-gateway-bridge/lora-gateway-bridge.toml

echo "[*] Installing LoRa-Net lora_gateway"
cd /usr/share/lora_gateway/
sudo git clone https://github.com/Lora-net/lora_gateway.git

sudo chmod -R 777 /usr/share/lora_gateway/lora_gateway && cd /usr/share/lora_gateway/lora_gateway
sed -i -e 's/DEBUG_HAL= 0/DEBUG_HAL= 1/g' ./libloragw/library.cfg
sed -i -e 's/dtparam=spi=off/dtparam=spi=on/g' /boot/config.txt
sudo make all

echo "[*] Installing LoRa-Net packet_forwarder"
cd /usr/share/lora_gateway/
sudo git clone https://github.com/Lora-net/packet_forwarder.git

sudo chmod -R 777 /usr/share/lora_gateway/packet_forwarder && cd /usr/share/lora_gateway/packet_forwarder
sudo make all

echo "[*] Installing Nodejs & npm"
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs nginx sqlite3

echo "[*] Installing lora_gateway"
cd /usr/share/lora_gateway
npm install -g

echo "[*] Setting nginx config"
sudo mv ./configs/nginx.conf /etc/nginx/sites-enabled/default
sudo service nginx restart

echo "[*] Setting lora_gateway systemctl service"
sudo mv ./configs/lora_gateway.service /etc/systemd/system/ && sudo chmod 664 /etc/systemd/system/lora_gateway.service
sudo mv ./configs/lora_gateway.sh /usr/local/bin && sudo chmod 744 /usr/local/bin/lora_gateway.sh

echo "[*] Setting packet_forwarder systemctl service"
sudo mv ./configs/packet_forwarder.service /etc/systemd/system/ && sudo chmod 664 /etc/systemd/system/packet_forwarder.service
sudo mv ./configs/packet_forwarder.sh /usr/local/bin && sudo chmod 744 /usr/local/bin/packet_forwarder.sh

echo "[*] Reloading systemctl"
sudo systemctl daemon-reload

echo "[*] Start LoRa gateway"
sudo service lora_gateway start
