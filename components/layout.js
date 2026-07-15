import Navbar from './navbar';
import Footer from './footer';

export default function Layout({ children, className = "" }) {
  return (
    <div className={`flex flex-col min-h-screen bg-white ${className}`}>
      <Navbar />
      <main className="flex-grow bg-white">
        {children}
      </main>
      <Footer />
    </div>
  );
}