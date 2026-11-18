/** @jsxImportSource react */
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Versão reduzida do `Button` do shadcn/ui — só as variantes/tamanhos que o
 * header de perfil (Card11) usa (`variant="ghost"`, `size="icon"`). Sem
 * `class-variance-authority`/`@radix-ui/react-slot` (sem `asChild` nem as
 * demais variantes) — escopo do pedido é só imagem+perfil, não o corpo
 * (botões de curtir/comentar/compartilhar ficam pra quando isso entrar).
 */
type ButtonVariant = 'default' | 'ghost';
type ButtonSize = 'default' | 'icon';

interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2',
  icon: 'size-8',
};

function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export { Button };
