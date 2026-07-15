import Link from 'next/link';

// Was a three-column gradient panel with hover-scaling social chips and gradient
// text. Tesla's footer is a hairline, a few quiet links, and silence. The phone
// number is the only thing a store owner ever actually wants from here, so it's
// the only thing with any weight.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="t-footer">
      <div className="t-footer__inner">
        <div className="t-footer__cols">
          <div>
            <p className="t-footer__lede">
              Matching collars and bracelets for you and your dog. Free display,
              zero inventory, paid on every tap.
            </p>
            <a href="tel:+17159791259" className="t-footer__phone">(715) 979-1259</a>
            <a href="mailto:oscar@pawpaya.com" className="t-footer__mail">oscar@pawpaya.com</a>
          </div>

          <nav className="t-footer__nav" aria-label="Footer">
            <Link href="/" className="t-footer__link">Home</Link>
            <Link href="/onboard" className="t-footer__link">For stores</Link>
            <Link href="/onboard/dashboard" className="t-footer__link">Dashboard</Link>
            <Link href="/privacy" className="t-footer__link">Privacy</Link>
          </nav>
        </div>

        <div className="t-footer__base">
          <span>© {year} Pawpaya</span>
          <Link href="/privacy" className="t-footer__link">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
