import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../context/AuthContext';

// Tesla's nav is a hairline and nothing else — no shadow, no bordered pill
// buttons competing with the page. Wordmark left, actions right, and the content
// beneath is trusted to carry the screen.
export default function Navbar() {
  const { user } = useAuthContext();

  return (
    <nav className="t-nav">
      <div className="t-nav__inner">
        <Link href="/" className="t-nav__brand" aria-label="Pawpaya home">
          <Image src="/pawpaya-logo-circle.png" alt="" width={28} height={28} priority />
          <span className="t-nav__word">Pawpaya</span>
        </Link>

        <div className="t-nav__links">
          <Link
            href="https://pawpayaco.com/products/friendship-collar-bracelet"
            target="_blank"
            rel="noopener noreferrer"
            className="t-navlink"
          >
            Shop
          </Link>
          <Link href="/onboard" className="t-navlink">For stores</Link>
          {user ? (
            <Link href="/onboard/dashboard" className="t-navlink t-navlink--strong">Dashboard</Link>
          ) : (
            <Link href="/login" className="t-navlink t-navlink--strong">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
