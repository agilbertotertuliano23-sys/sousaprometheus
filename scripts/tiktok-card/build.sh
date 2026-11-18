#!/bin/bash
# Reconstrói public/modelos-3d/tiktok-card.glb a partir de tiktok-card.orig.glb
# com os ajustes de ajustes.json (posições/escala das peças, materiais) e achata
# a ponta do balão. Rode dentro desta pasta:  bash build.sh
# O ambiente de luz (public/modelos-3d/estudio.jpg) sai de:  python gen_env.py <saida.jpg>
M="../../public/modelos-3d"
node glb-build.mjs "$M/tiktok-card.orig.glb" "$M/tiktok-card.glb" "$(cat ajustes.json)" 1.45 1.8
