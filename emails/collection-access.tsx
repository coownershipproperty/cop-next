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

interface CollectionAccessEmailProps {
  firstName?: string;
  accessUrl: string;
}

export default function CollectionAccessEmail({
  firstName = 'there',
  accessUrl,
}: CollectionAccessEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your private access to The Mosaic Collection</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>CO-OWNERSHIP PROPERTY</Text>
          </Section>
          <Img
            src="https://co-ownership-property.com/images/collections/mosaic/mallorca-port-d-andratx.jpg"
            alt="The Mosaic Collection"
            width="600"
            style={hero}
          />
          <Section style={content}>
            <Text style={eyebrow}>THE MOSAIC COLLECTION</Text>
            <Heading style={heading}>Your private collection guide is ready</Heading>
            <Text style={paragraph}>Hello {firstName},</Text>
            <Text style={paragraph}>
              Your personal link brings together the five homes in Mallorca, Tuscany, Chamonix, Barcelona and the South of France, with detailed home information and collection facts in one place.
            </Text>
            <Section style={buttonWrap}>
              <Button href={accessUrl} style={button}>VIEW THE COLLECTION GUIDE</Button>
            </Section>
            <Text style={small}>Keep this email — the link will remain your direct route back to the collection.</Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>Co-Ownership Property · co-ownership-property.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = { margin: '0', padding: '0', backgroundColor: '#f2efe9', fontFamily: 'Arial, Helvetica, sans-serif' };
const container = { maxWidth: '600px', margin: '28px auto', backgroundColor: '#ffffff' };
const header = { padding: '24px 32px', backgroundColor: '#18364f', textAlign: 'center' as const };
const wordmark = { margin: '0', color: '#ffffff', fontSize: '13px', letterSpacing: '3px' };
const hero = { width: '100%', height: '240px', objectFit: 'cover' as const, display: 'block' };
const content = { padding: '38px 42px 34px' };
const eyebrow = { margin: '0 0 12px', color: '#c99a37', fontSize: '12px', fontWeight: '700', letterSpacing: '2px' };
const heading = { margin: '0 0 24px', color: '#18364f', fontFamily: 'Georgia, Times New Roman, serif', fontSize: '34px', fontWeight: '400', lineHeight: '1.2' };
const paragraph = { margin: '0 0 18px', color: '#4f6477', fontSize: '16px', lineHeight: '1.7' };
const buttonWrap = { padding: '12px 0 18px', textAlign: 'center' as const };
const button = { backgroundColor: '#c99a37', color: '#ffffff', padding: '15px 24px', fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textDecoration: 'none' };
const small = { margin: '6px 0 0', color: '#7a8792', fontSize: '13px', lineHeight: '1.6', textAlign: 'center' as const };
const footer = { padding: '22px 32px', backgroundColor: '#f7f4ee', textAlign: 'center' as const };
const footerText = { margin: '0', color: '#74818c', fontSize: '12px' };
