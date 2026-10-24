import Image from "next/image";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="OriginRadar"
      width={540}
      height={406}
      className={className}
      priority
    />
  );
}
