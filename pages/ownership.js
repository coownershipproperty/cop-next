import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

export default function Ownership() {
  return (
    <>
      <Head>
        <title>Ownership and Funding | Co-Ownership Property</title>
        <meta name="description" content="Understand how fractional ownership is legally structured — LLC ownership, deeded title, funding options, and how co-owners hold and sell their shares." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <div dangerouslySetInnerHTML={{__html: bodyHtml}} />
      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}

const bodyHtml = `<!-- ===== COP Navigation Bar ===== -->

<!-- /COP Navigation Bar -->



<div class="website-wrapper wpresidence_wrapper_for_header_type1  wide " id="all_wrapper">
<div class="container-fluid px-0 wpresidence_main_wrapper_class  wide  has_header_type1 ">
<main class="content_wrapper container-fluid">

<div class="wpresidence-content-container-wrapper col-12 row flex-wrap">
    <div class="col-12 breadcrumb_container "></div>    
    <div class="col-xs-12 col-lg-12 p-0  single_width_page">
        <span class="entry-title listing_loader_title">Your search results</span>
<div class="spinner" id="listing_loader">
  <div class="rect1"></div>
  <div class="rect2"></div>
  <div class="rect3"></div>
  <div class="rect4"></div>
  <div class="rect5"></div>
</div>
<div id="listing_ajax_container">
</div>        
                        <h1 class="entry-title">Ownership and Funding</h1>
                    <div class="single-content"><p data-start="1210" data-end="1323">Co-Ownership Property is privately owned and operated by an independent real estate professional based in the UK and Marbella.</p>
<p data-start="1328" data-end="1616">The website is self-funded and does not receive external grants, corporate sponsorship, or third-party advertising revenue. All content and property listings are selected for publication based on their relevance, quality, and potential value to our audience, not based on paid promotion.</p>
<p data-start="1621" data-end="1811">We maintain editorial independence and only collaborate with property developers and platforms that align with our values of transparency, legal clarity, and long-term ownership flexibility.</p>
</div><!-- single content -->
        
            </div>
 
    <!-- begin sidebar -->
<!-- end sidebar --></div>  

</main><!-- end content_wrapper started in header --></div> <!-- end class container -->


<!-- #colophon -->
</div> <!-- end website wrapper -->


<input type="hidden" id="wpestate_ajax_log_reg" value="d2e28d2e16" />    <a href="#" class="backtop"  aria-label="up" ><i class="fas fa-chevron-up"></i></a>
    <a href="#" class="contact-box "  aria-label="contact" ><i class="fas fa-envelope"></i></a>


 
<div class="contactformwrapper  hidden"> 

        <div id="footer-contact-form">
        <div class="contact_close_button">
            <i class="fas fa-times" aria-hidden="true"></i>
        </div>
        <h4>Contact Us</h4>
        <p>Use the form below to contact us!</p>
        <div class="alert-box error">
            <div class="alert-message" id="footer_alert-agent-contact"></div>
        </div> 

        
        <input type="text" placeholder="Your Name" required="required"   id="foot_contact_name"  name="contact_name" class="form-control" value="" tabindex="373"> 
        <input type="email" required="required" placeholder="Your Email"  id="foot_contact_email" name="contact_email" class="form-control" value="" tabindex="374">
        <input type="email" required="required" placeholder="Your Phone"  id="foot_contact_phone" name="contact_phone" class="form-control" value="" tabindex="374">
        <textarea placeholder="Type your message..." required="required" id="foot_contact_content" name="contact_content" class="form-control" tabindex="375"></textarea>
        <input type="hidden" name="contact_ajax_nonce" id="agent_property_ajax_nonce"  value="2545ffece6" />

                <div class="btn-cont">
            <button type="submit" id="btn-cont-submit" class="wpresidence_button">Send</button>
         
            <input type="hidden" value="" name="contact_to">
            <div class="bottom-arrow"></div>
        </div>  
    </div>
    
</div>
<!--Compare Starts here-->     
<div class="prop-compare ">
    <div id="compare_close"><i class="fas fa-times" aria-hidden="true"></i></div>
    <form method="post" id="form_compare" action="https://co-ownership-property.com/">
        <h4 class="title_compare">Compare Listings</h4>
        <button   id="submit_compare" class="wpresidence_button"> Compare </button>
    </form>
</div>    
<!--Compare Ends here-->  <input type="hidden" id="wpestate_ajax_filtering" value="bbd729ca09" /><input type="hidden" id="wpestate_payments_nonce" value="8971223dc8" />`;
