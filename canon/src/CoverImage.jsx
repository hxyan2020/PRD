import { hdCoverUrl } from "./cover.js";

export default function CoverImage({
  src,
  alt = "",
  className,
  loading = "lazy",
  priority = false,
} = {}) {
  return (
    <img
      className={className}
      src={hdCoverUrl(src)}
      alt={alt}
      width="640"
      height="640"
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      draggable="false"
    />
  );
}
