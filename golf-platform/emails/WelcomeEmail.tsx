import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button } from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to the Golf Charity Draw!</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
      <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', borderRadius: '8px' }}>
        <Heading style={{ color: '#0A0E1A', fontSize: '24px', textAlign: 'center' }}>Welcome to the Club, {name}!</Heading>
        <Text style={{ color: '#333', fontSize: '16px', lineHeight: '24px' }}>
          Your subscription is now active. You can now start entering your Stableford scores to enter the monthly prize draws.
        </Text>
        <Text style={{ color: '#333', fontSize: '16px', lineHeight: '24px' }}>
          Remember, a portion of your subscription goes directly to your selected charity. Thank you for your support!
        </Text>
        <Section style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`} style={{ backgroundColor: '#00D4B8', color: '#0A0E1A', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
            Go to Dashboard
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;
