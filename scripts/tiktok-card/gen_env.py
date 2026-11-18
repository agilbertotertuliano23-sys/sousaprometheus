"""Gera um mapa de ambiente equirretangular de ESTÚDIO CLARO (LDR) pro model-viewer.
Fundo claro + softboxes brancas: o branco brilhante do card passa a refletir claro
(em vez de cinza) e o aro preto ganha reflexos de estúdio. Saída: JPG 1024x512."""
import sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 1024, 512
saida = sys.argv[1]

v = np.linspace(0, 1, H)[:, None]  # 0 = topo, 1 = chão
base = np.where(v < 0.5, 1.0 - 0.05 * (v / 0.5), 0.95 - 0.30 * ((v - 0.5) / 0.5))  # céu claro -> horizonte -> chão médio
img = np.repeat(base, W, axis=1)


def caixa(u0, u1, v0, v1, brilho=1.0):
    x0, x1 = int(u0 * W), int(u1 * W)
    y0, y1 = int(v0 * H), int(v1 * H)
    img[y0:y1, x0:x1] = brilho


# softboxes: frente-esquerda, frente-direita, faixa no topo, recorte atrás
caixa(0.10, 0.22, 0.22, 0.62)
caixa(0.30, 0.40, 0.25, 0.60)
caixa(0.62, 0.72, 0.22, 0.62)
caixa(0.80, 0.90, 0.25, 0.60)
caixa(0.0, 1.0, 0.02, 0.10)

rgb = np.clip(np.stack([img, img, img], axis=-1), 0, 1)
im = Image.fromarray((rgb * 255).astype('uint8'), 'RGB').filter(ImageFilter.GaussianBlur(9))
im.save(saida, quality=92)
print('ok', saida, im.size)
