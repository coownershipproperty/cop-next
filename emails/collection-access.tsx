import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailColorScheme } from './_color-scheme';

interface CollectionAccessEmailProps {
  firstName?: string;
  accessUrl: string;
  collectionTitle?: string;
  heroImage?: string;
  summary?: string;
  homes?: GuideHome[];
}

interface GuideHome {
  place: string;
  name: string;
  status?: string;
  text?: string;
  photos: string[];
  note?: string; // set when the photos show a past home, not this one
}

// Defaults are the original Mosaic Collection 14 email; database collections
// (lib/collections.js) pass their own title, photo and one-line summary.
export default function CollectionAccessEmail({
  firstName = 'there',
  accessUrl,
  collectionTitle = 'Mosaic Collection 14',
  heroImage = 'https://co-ownership-property.com/images/collections/mosaic/mallorca-port-d-andratx.jpg',
  summary = 'Your personal link brings together the five homes in Mallorca, Tuscany, Chamonix, Barcelona and the South of France, with detailed home information and collection facts in one place.',
  homes = [],
}: CollectionAccessEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <EmailColorScheme />
      </Head>
      <Preview>{`Your private access to ${collectionTitle}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>CO-OWNERSHIP PROPERTY</Text>
          </Section>
          <Img
            src={heroImage}
            alt={collectionTitle}
            width="600"
            style={hero}
          />
          <Section style={content}>
            <Text style={eyebrow}>{collectionTitle.toUpperCase()}</Text>
            <Heading style={heading}>Your private collection guide is ready</Heading>
            <Text style={paragraph}>Hello {firstName},</Text>
            <Text style={paragraph}>{summary}</Text>
            <Section style={buttonWrap}>
              <Button href={accessUrl} style={button}>VIEW THE COLLECTION GUIDE</Button>
            </Section>
            <Text style={small}>Keep this email — the link will remain your direct route back to the collection.</Text>
          </Section>
          {homes.map((h, i) => (
            <Section key={h.place + i} style={homeBlock}>
              <Text style={homeNo}>{String(i + 1).padStart(2, '0')} — {h.place.toUpperCase()}{h.status ? `  ·  ${h.status.toUpperCase()}` : ''}</Text>
              <Heading as="h2" style={homeTitle}>{h.name}</Heading>
              {h.photos[0] && <Img src={h.photos[0]} alt={h.name} width="536" style={homeHero} />}
              {h.photos.length > 1 && (
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: '6px' }}>
                  <tbody><tr>
                    {h.photos.slice(1, 3).map((src, k) => (
                      <td key={src} width="50%" style={{ paddingLeft: k ? '3px' : 0, paddingRight: k ? 0 : '3px' }}>
                        <Img src={src} alt="" width="265" style={homeThumb} />
                      </td>
                    ))}
                  </tr></tbody>
                </table>
              )}
              {h.note && <Text style={homeNote}>{h.note}</Text>}
              {h.text && <Text style={homeText}>{h.text}</Text>}
            </Section>
          ))}
          {homes.length > 0 && (
            <Section style={{ ...buttonWrap, padding: '8px 32px 34px' }}>
              <Button href={accessUrl} style={button}>SEE EVERY PHOTOGRAPH</Button>
            </Section>
          )}
          <Section style={footer}>
            <Text style={footerText}>Co-Ownership Property · co-ownership-property.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = { margin: '0', padding: '0', backgroundColor: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' };
const container = { maxWidth: '600px', margin: '28px auto', backgroundColor: '#ffffff' };
const header = { padding: '24px 32px', backgroundColor: '#111111', textAlign: 'center' as const };
const wordmark = { margin: '0', color: '#ffffff', fontSize: '13px', letterSpacing: '3px' };
const hero = { width: '100%', height: '240px', objectFit: 'cover' as const, display: 'block' };
const content = { padding: '38px 42px 34px' };
const eyebrow = { margin: '0 0 12px', color: '#111111', fontSize: '12px', fontWeight: '700', letterSpacing: '2px' };
const heading = { margin: '0 0 24px', color: '#111111', fontFamily: 'Georgia, Times New Roman, serif', fontSize: '34px', fontWeight: '400', lineHeight: '1.2' };
const paragraph = { margin: '0 0 18px', color: '#3d3d3d', fontSize: '16px', lineHeight: '1.7' };
const buttonWrap = { padding: '12px 0 18px', textAlign: 'center' as const };
const button = { backgroundColor: '#111111', color: '#ffffff', padding: '15px 24px', fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textDecoration: 'none' };
const small = { margin: '6px 0 0', color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6', textAlign: 'center' as const };
const footer = { padding: '22px 32px', backgroundColor: '#f5f5f5', textAlign: 'center' as const };
const footerText = { margin: '0', color: '#6b6b6b', fontSize: '12px' };
const homeBlock = { padding: '0 32px 34px' };
const homeNo = { margin: '0 0 8px', color: '#7a746b', fontSize: '11px', letterSpacing: '2px' };
const homeTitle = { margin: '0 0 16px', color: '#111111', fontFamily: 'Georgia, Times New Roman, serif', fontSize: '24px', fontWeight: '400', lineHeight: '1.25' };
const homeHero = { width: '100%', height: '300px', objectFit: 'cover' as const, display: 'block' };
const homeThumb = { width: '100%', height: '150px', objectFit: 'cover' as const, display: 'block' };
const homeNote = { margin: '10px 0 0', color: '#7a746b', fontSize: '12.5px', fontStyle: 'italic', lineHeight: '1.55' };
const homeText = { margin: '12px 0 0', color: '#3d3d3d', fontSize: '15px', lineHeight: '1.65' };
