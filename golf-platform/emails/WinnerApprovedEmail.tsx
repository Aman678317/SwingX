import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button } from '@react-email/components';
import * as React from 'react';

interface WinnerApprovedEmailProps {
  name: string;
  amount: number;
}

export const WinnerApprovedEmail = ({ name, amount }: WinnerApprovedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your prize verification is approved!</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
      <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', borderRadius: '8px' }}>
        <Heading style={{ color: '#0A0E1A', fontSize: '24px', textAlign: 'center' }}>Verification Approved, {name}!</Heading>
        <Text style={{ color: '#333', fontSize: '16px', lineHeight: '24px' }}>
          Great news! Our team has successfully reviewed your verification documents. Your prize of <strong>€{amount.toFixed(2)}</strong> will be processed for payout shortly.
        </Text>
        <Text style={{ color: '#333', fontSize: '16px', lineHeight: '24px' }}>
          You can track your payout status directly in your dashboard.
        </Text>
        <Section style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings`} style={{ backgroundColor: '#00D4B8', color: '#0A0E1A', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
            View Dashboard
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WinnerApprovedEmail;
