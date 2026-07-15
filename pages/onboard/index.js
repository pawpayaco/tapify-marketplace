import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

// A store owner who has never heard of Pawpaya needs three things: what this is,
// what they get, and how to get one. The display photo answers the first one on
// its own, so the page mostly gets out of its way.
export default function OnboardIndex() {
  const [isCopied, setIsCopied] = useState(false);

  const handleManagerShare = async () => {
    const shareUrl = window.location.origin + '/onboard/about';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (clipboardErr) {
      console.log('Clipboard write failed:', clipboardErr);
    }
  };

  return (
    <div className="t-page">
      <section className="o-hero">
        <div className="o-hero__copy">
          <h1 className="o-h1">
            A free display<br />for your store.
          </h1>
          <p className="o-lede">
            Customers tap it to make a collar for their dog. We ship it to them.
            You keep <span className="o-pct">30%</span>.
          </p>
          <div className="o-actions">
            <Link href="/onboard/register" className="t-btn t-btn--primary">Claim your display</Link>
            <a href="tel:+17159791259" className="t-btn t-btn--secondary">(715) 979-1259</a>
          </div>
        </div>

        <div className="o-hero__img">
          <Image
            src="/images/image41.jpg"
            alt="The Pawpaya countertop display, stocked with beaded name collars"
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 900px) 100vw, 52vw"
          />
        </div>
      </section>

      <section className="o-facts">
        <div className="o-fact">
          <p className="o-fact__k">Costs you</p>
          <p className="o-fact__v">Nothing</p>
        </div>
        <div className="o-fact">
          <p className="o-fact__k">You stock</p>
          <p className="o-fact__v">Nothing</p>
        </div>
        <div className="o-fact">
          <p className="o-fact__k">You keep</p>
          <p className="o-fact__v">30%</p>
        </div>
      </section>

      <section className="o-close">
        <Link href="/onboard/register" className="t-btn t-btn--primary">Claim your display</Link>
        <button onClick={handleManagerShare} className="o-share">
          {isCopied ? 'Link copied' : 'Not the owner? Send this to them'}
        </button>
      </section>
    </div>
  );
}
