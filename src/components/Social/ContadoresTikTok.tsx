/** @jsxImportSource react */
/**
 * ContadoresTikTok — contadores de seguidores e curtidas (dígitos que rolam,
 * `Efeitos/Counter.tsx`). Ilha React `client:visible`: só monta quando a seção
 * aparece, então os números partem de 0 e rolam até o valor real logo em
 * seguida. Os valores batem com o card 3D de `SigaTikTok.astro` (26,4 mil
 * seguidores, 11,5 milhões de curtidas — placeholders, como lá).
 *
 * Números decimais (26,4) usam `places` com "." e `decimalChar=","` (pt-BR);
 * o sufixo ("mil"/"milhões") é texto ao lado. Movimento reduzido: spring rígido
 * (chega direto ao valor). Estilo editorial: fio fino em cima, rótulo pequeno em
 * caixa alta embaixo. Fontes: DÍGITOS em Rubik 800 — a Bigerside Expanded (versão
 * demo) troca os numerais por "RONNY STUDIO DEMO"; ela fica só no sufixo (letras).
 */
import { useEffect, useState } from 'react';
import Counter from '../Efeitos/Counter';

type Casa = number | '.';

interface Item {
  valor: number;
  casas: Casa[];
  sufixo: string;
  rotulo: string;
}

interface Props {
  itens: Item[];
}

export default function ContadoresTikTok({ itens }: Props) {
  const [ativo, setAtivo] = useState(false);
  const [fs, setFs] = useState(88);
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    const ajusta = () => setFs(Math.round(Math.min(120, Math.max(52, window.innerWidth * 0.085))));
    ajusta();
    window.addEventListener('resize', ajusta);
    setReduzido(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // pequena espera pra o usuário ver os dígitos em 0 antes de rolarem
    const id = window.setTimeout(() => setAtivo(true), 250);
    return () => {
      window.removeEventListener('resize', ajusta);
      window.clearTimeout(id);
    };
  }, []);

  const spring = reduzido ? { stiffness: 1000, damping: 100 } : { stiffness: 28, damping: 14 };

  return (
    <div
      className="flex flex-col items-center justify-center gap-12 md:flex-row md:items-start md:gap-24"
      style={{ fontFamily: "'Rubik', system-ui, sans-serif", color: '#fff' }}
    >
      {itens.map((item) => (
        <div key={item.rotulo} className="flex flex-col items-center gap-3 border-t border-white/25 pt-5">
          <div className="flex items-end gap-3" aria-label={`${item.valor} ${item.sufixo} ${item.rotulo}`}>
            <span aria-hidden="true">
              <Counter
                value={ativo ? item.valor : 0}
                places={item.casas}
                fontSize={fs}
                gap={2}
                horizontalPadding={0}
                borderRadius={0}
                textColor="#fff"
                fontWeight={800}
                gradientHeight={Math.round(fs * 0.16)}
                gradientFrom="#000"
                decimalChar=","
                springConfig={spring}
              />
            </span>
            <span
              aria-hidden="true"
              style={{
                fontFamily: "'Bigerside', sans-serif",
                fontSize: Math.round(fs * 0.3),
                lineHeight: 1,
                paddingBottom: Math.round(fs * 0.12),
              }}
            >
              {item.sufixo}
            </span>
          </div>
          <span
            className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/60"
            style={{ fontFamily: 'var(--ed-rotulo-fonte)' }}
          >
            {item.rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}
