interface BrandProps {
  className?: string;
}

/**
 * Фирменное написание бренда: «Щ» — белым (text-foreground),
 * «ИТ» — фирменным золотом (text-gold). Единый источник правды,
 * чтобы бренд выглядел одинаково во всех частях сайта.
 */
export default function Brand({ className = "" }: BrandProps) {
  return (
    <span className={className}>
      Щ<span className="text-gold">ИТ</span>
    </span>
  );
}
