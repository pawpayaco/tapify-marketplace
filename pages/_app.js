import "../styles/globals.css";
import Head from "next/head";
import { AuthProvider } from "../context/AuthContext";
import Layout from "../components/layout";

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </>
    </AuthProvider>
  );
}
