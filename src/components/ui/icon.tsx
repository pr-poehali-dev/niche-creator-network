import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
  fallback?: string;
}

const DIRECTIONAL_ICONS = new Set([
  'ArrowRight', 'ArrowLeft', 'ChevronRight', 'ChevronLeft',
  'ArrowUpRight', 'ArrowDownRight', 'ArrowUpLeft', 'ArrowDownLeft',
  'ChevronsRight', 'ChevronsLeft', 'CornerDownRight', 'CornerDownLeft',
  'MoveRight', 'MoveLeft', 'LogIn', 'LogOut', 'Reply', 'Send',
]);

const Icon: React.FC<IconProps> = ({ name, fallback = 'CircleAlert', className, ...props }) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[name];
  const dirClass = DIRECTIONAL_ICONS.has(name) ? 'rtl-flip' : '';
  // Скруглённые концы и стыки линий + чуть более тонкий штрих: иконки
  // становятся мягче и дружелюбнее, а не «чертёжными». Задаём здесь один
  // раз — значит, применится ко всем иконкам сайта сразу.
  const iconDefaults = {
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: props.strokeWidth ?? 1.75,
  };
  const mergedClass = [className, dirClass].filter(Boolean).join(' ') || undefined;

  if (!IconComponent) {
    // Если иконка не найдена, используем fallback иконку
    const FallbackIcon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[fallback];

    // Если даже fallback не найден, возвращаем пустой span
    if (!FallbackIcon) {
      return <span className="text-xs text-gray-400">[icon]</span>;
    }

    return <FallbackIcon className={mergedClass} {...iconDefaults} {...props} />;
  }

  return <IconComponent className={mergedClass} {...iconDefaults} {...props} />;
};

export default Icon;