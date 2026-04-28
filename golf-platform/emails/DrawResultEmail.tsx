import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button } from '@react-email/components';
import * as React from 'react';

interface DrawResultEmailProps {
  name: string;
  matchCount: number;
  prizeAmount: number;
}

export const DrawResultEmail = ({ name, matchCount, prizeAmount }: DrawResultEmailProps) => (
  <Html>
    <Head />
    <Preview>You won in the Golf Charity Draw!</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
      <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', borderRadius: '8px' }}>
        <Heading style={{ color: '#0A0E1A', fontSize: '24px', textAlign: 'center' }}>Congratulations {name}!</Heading>
        <Text style={{ color: '#333', fontSize: '16px', lineHeight: '24px', textAlign: 'center' }}>
          You matched {matchCount} numbers in this month's draw and won!
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Text style={{ fontSize: '36px', fontWeight: 'bold', color: '#F4A922', margin: '0' }}>
            €{prizeAmount.toFixed(2)}
          </Text>
        </Section>
        <Text style={{ color: '#333', fontSize: '16px', lineHeight: '24px', textAlign: 'center' }}>
          Please log into your dashboard to upload your verification proof and claim your prize.
        </Text>
        <Section style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings`} style={{ backgroundColor: '#00D4B8', color: '#0A0E1A', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
            Claim Your Prize
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default DrawResultEmail;
