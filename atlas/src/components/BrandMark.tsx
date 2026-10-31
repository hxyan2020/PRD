type Props = {
  className?: string;
  size?: number;
};

/** Shared Ludus Atlas brand mark (red cat / controller). */
export function BrandMark({ className = "brand-mark", size = 36 }: Props) {
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}logo-cat.png`}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      decoding="async"
    />
  );
}
