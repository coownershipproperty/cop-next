import Layout from '../components/Layout';
export default function Blog() {
  return (
    <Layout title="Our Blog" description="Insights, guides and news from the world of fractional property ownership.">
      <section style={{background:'var(--blue)',padding:'7rem 2rem 4rem',textAlign:'center'}}>
        <div className="eyebrow" style={{color:'var(--gold)',marginBottom:'1rem'}}>Insights</div>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:400,color:'white',marginBottom:'1rem'}}>Our <em>Blog</em></h1>
        <p style={{color:'rgba(255,255,255,0.7)',maxWidth:480,margin:'0 auto'}}>Guides, market insights and buyer stories from the world of co-ownership.</p>
      </section>
      <section style={{background:'var(--cream)',padding:'5rem 2rem',textAlign:'center'}}>
        <p style={{color:'var(--muted)'}}>Blog posts coming soon — connecting to WordPress database.</p>
      </section>
    </Layout>
  );
}
