export default function ClaimPage({ u }) {
  return (
    <main style={{padding:20,fontFamily:'system-ui'}}>
      <h1>Claim UID</h1>
      <p>UID: <b>{u || '—'}</b></p>
      <p>This is the fallback page. Hook this up to your Supabase claim flow.</p>
    </main>
  );
}
export async function getServerSideProps({ query }) {
  return { props: { u: query.u || null } };
}
