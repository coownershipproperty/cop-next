import Document, { Html, Head, Main, NextScript } from "next/document";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_META } from "@/lib/i18n";

// Infer locale from request URL so <html lang> matches the hreflang the page emits.
// We don't use Next's built-in i18n config (slugs differ per locale: /es/como-funciona,
// /fr/comment-ca-marche, /de/so-funktionierts), so the lang must be derived from the
// path prefix.
//
// This deliberately reads SUPPORTED_LOCALES rather than a hard-coded list: the
// previous version listed de/es/fr only, so every page under /it/, /nl/, /pt/,
// /sv/, /da/ and /no/ was served as <html lang="en">, contradicting its own
// hreflang and canonical tags on several hundred URLs per locale.
function localeFromPath(pathname) {
  if (!pathname) return DEFAULT_LOCALE;
  const seg = pathname.split("?")[0].split("/").filter(Boolean)[0];
  return SUPPORTED_LOCALES.includes(seg) && seg !== DEFAULT_LOCALE ? seg : DEFAULT_LOCALE;
}

// The BCP-47 tag, not the bare locale key: en-GB, pt-BR, nb rather than en, pt, no.
function htmlLangFor(locale) {
  return (LOCALE_META[locale] || {}).htmlLang || locale || "en";
}

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const lang = htmlLangFor(localeFromPath(ctx.asPath || ctx.pathname || ""));
    return { ...initialProps, lang };
  }

  render() {
    return (
      <Html lang={this.props.lang || "en"}>
        <Head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
