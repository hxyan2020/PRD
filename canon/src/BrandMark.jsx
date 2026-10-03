import { publicUrl } from "./urls.js";

export default function BrandMark({
  className = "brand-mark",
  alt = "Canon",
  priority = false,
  width = 88,
  height = 88,
} = {}) {
  return (
    <img
      className={className}
      src={publicUrl("logo.png")}
      alt={alt}
      width={width}
      height={height}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
