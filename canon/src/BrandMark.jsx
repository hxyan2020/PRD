import { publicUrl } from "./urls.js";

export default function BrandMark({ className = "brand-mark", alt = "Canon" }) {
  return (
    <img
      className={className}
      src={publicUrl("logo.png")}
      alt={alt}
      width="88"
      height="88"
      decoding="async"
    />
  );
}
