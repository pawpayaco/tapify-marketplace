import Navbar from './navbar';
import Footer from './footer';

export default function Layout({ children, className = "" }) {
  return (
    <div className={`flex flex-col min-h-screen bg-gray-100 ${className}`}>
      <Navbar />
      <main className="flex-grow bg-gray-100">
        {children}
      </main>
      <Footer />
    </div>
  );
}