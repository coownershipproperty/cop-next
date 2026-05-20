import Document, { Html, Head, Main, NextScript } from "next/document";

// Infer locale from request URL so <html lang> matches the hreflang the page emits.
// We don't use Next's built-in i18n config (slugs differ per locale: /es/como-funciona,
// /fr/comment-ca-marche, /de/so-funktionierts), so the lang must be derived from the
// path prefix.
function localeFromPath(pathname) {
  if (!pathname) return "en";
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg === "de" || seg === "es" || seg === "fr") return seg;
  return "en";
}

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const lang = localeFromPath(ctx.asPath || ctx.pathname || "");
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
