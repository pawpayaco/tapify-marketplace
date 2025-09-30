import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import Layout from "../components/layout";

export default function MyApp({ Component, pageProps }) {
  console.log('_app rendering'); // DEBUG
  
  return (
    <AuthProvider>
      <div style={{ border: '5px solid red', padding: '20px' }}>
        <h1>TEST - If you see this, app is rendering</h1>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </div>
    </AuthProvider>
  );
}