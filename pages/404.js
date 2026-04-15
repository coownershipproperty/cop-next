import Layout from '../components/Layout';
import Link from 'next/link';
export default function NotFound() {
  return (
    <Layout title="Page Not Found">
      <section style={{background:'var(--cream)',padding:'8rem 2rem',textAlign:'center',minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:'6rem',color:'var(--gold)',opacity:0.3,fontWeight:700}}>404</div>
          <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'2rem',color:'var(--blue)',marginBottom:'1rem'}}>Page Not Found</h1>
          <p style={{color:'var(--muted)',marginBottom:'2rem'}}>The page you're looking for doesn't exist.</p>
          <Link href="/" className="btn-gold" style={{display:'inline-block'}}>Back to Home</Link>
        </div>
      </section>
    </Layout>
  );
}
