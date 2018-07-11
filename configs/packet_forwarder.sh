#!/bin/bash

cd /usr/share/lora_gateway/lora_gateway && ./reset_lgw.sh start 17
cd /usr/share/lora_gateway/packet_forwarder/ && sudo make all && cd ./lora_pkt_fwd && ./lora_pkt_fwd
