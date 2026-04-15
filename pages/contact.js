import Layout from '../components/Layout';
import { useState } from 'react';

function ContactForm() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', message:'' });
  const [sent, setSent] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const submit = async e => {
    e.preventDefault();
    try { await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); } catch{}
    setSent(true);
  };
  const inp = { width:'100%', padding:'0.9rem 1rem', border:'1px solid var(--border)', background:'white', fontFamily:'Nunito Sans,sans-serif', fontSize:'0.88rem', marginBottom:'1rem', outline:'none', color:'var(--text)' };
  if(sent) return <div style={{textAlign:'center',padding:'3rem',color:'var(--blue)'}}><div style={{fontSize:'2rem',marginBottom:'1rem'}}>✓</div><h3 style={{fontFamily:'Playfair Display,serif',marginBottom:'0.5rem'}}>Message Sent</h3><p style={{color:'var(--muted)'}}>We typically respond within a few hours.</p></div>;
  return (
    <form onSubmit={submit}>
      <input required placeholder="Your name *" value={form.name} onChange={set('name')} style={inp}/>
      <input required type="email" placeholder="Email address *" value={form.email} onChange={set('email')} style={inp}/>
      <input placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} style={inp}/>
      <textarea placeholder="How can we help?" value={form.message} onChange={set('message')} rows={5} style={{...inp,resize:'vertical'}}/>
      <button type="submit" className="btn-gold" style={{width:'100%',marginTop:'0.5rem'}}>Send Message</button>
    </form>
  );
}

export default function Contact() {
  return (
    <Layout title="Contact" description="Get in touch with the Co-Ownership Property team. No pressure, no obligation. We respond within a few hours.">
      <section style={{background:'var(--blue)',padding:'7rem 2rem 4rem',textAlign:'center'}}>
        <div className="eyebrow" style={{color:'var(--gold)',marginBottom:'1rem'}}>Get In Touch</div>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:400,color:'white',marginBottom:'1rem'}}>
          Let&apos;s <em>Talk</em>
        </h1>
        <p style={{color:'rgba(255,255,255,0.7)',maxWidth:480,margin:'0 auto'}}>Straight answers, no sales pressure, no obligation.</p>
      </section>
      <section style={{background:'var(--cream)',padding:'5rem 2rem'}}>
        <div style={{maxWidth:960,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'3rem',alignItems:'start'}}>
          {/* Info */}
          <div>
            <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'1.8rem',fontWeight:400,color:'var(--blue)',marginBottom:'1.5rem'}}>How We Can Help</h2>
            {[
              {icon:'✉', title:'Email Us Directly', desc:<><a href="mailto:info@co-ownership-property.com" style={{color:'var(--gold)'}}>info@co-ownership-property.com</a></>},
              {icon:'⏱', title:'Fast Response', desc:'We typically respond within a few hours (we&apos;re based in the UK).'},
              {icon:'○', title:'No Pressure', desc:'We&apos;re independent. No quotas, no commissions pushing you toward the wrong property.'},
            ].map(item => (
              <div key={item.title} style={{display:'flex',gap:'1rem',marginBottom:'2rem'}}>
                <div style={{fontSize:'1.5rem',flexShrink:0,marginTop:'2px'}}>{item.icon}</div>
                <div>
                  <h3 style={{fontFamily:'Playfair Display,serif',fontSize:'1rem',color:'var(--blue)',marginBottom:'0.3rem'}}>{item.title}</h3>
                  <p style={{color:'var(--muted)',fontSize:'0.88rem',lineHeight:1.7}}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Form */}
          <div style={{background:'white',padding:'2.5rem',boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
            <h3 style={{fontFamily:'Playfair Display,serif',fontSize:'1.4rem',color:'var(--blue)',marginBottom:'1.5rem'}}>Send Us a Message</h3>
            <ContactForm />
          </div>
        </div>
      </section>
    </Layout>
  );
}
