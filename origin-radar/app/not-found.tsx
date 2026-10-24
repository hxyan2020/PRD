import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel p-10 text-center">
      <p className="kicker">404</p>
      <h1 className="mt-2 font-serif text-4xl">Signal not on the desk</h1>
      <Link href="/" className="mt-6 inline-block text-rust">
        Back to radar
      </Link>
    </div>
  );
}
