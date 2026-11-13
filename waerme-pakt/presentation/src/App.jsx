import React from 'react';
import {
  Deck,
  Slide,
  Heading,
  Text,
  FlexBox,
  Box,
  DefaultTemplate,
  UnorderedList,
  ListItem,
} from 'spectacle';
import FakeGoogleSlide from './components/FakeGoogleSlide';

const theme = {
  colors: {
    primary: '#f8fafc',
    secondary: '#60a5fa',
    tertiary: '#0f172a',
    quaternary: '#38bdf8',
  },
  fonts: {
    header: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    text: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export default function App() {
  return (
    <Deck theme={theme} template={<DefaultTemplate />}>
      {/* Slide 1: Intro */}
      <Slide backgroundColor="tertiary">
        <FlexBox height="100%" flexDirection="column" justifyContent="center" alignItems="center">
          <Box
            padding="6px 14px"
            borderRadius="999px"
            backgroundColor="rgba(56, 189, 248, 0.14)"
            marginBottom="18px"
          >
            <Text fontSize="16px" color="quaternary" margin="0" fontWeight="bold">
              INTERACTIVE SPECTACLE DEMO
            </Text>
          </Box>
          <Heading fontSize="56px" color="primary" margin="0 0 16px 0" textAlign="center">
            Search Intent &amp; Sponsored Ads
          </Heading>
          <Text fontSize="24px" color="#94a3b8" textAlign="center" maxWidth="720px" margin="0 0 32px 0">
            See how a user&apos;s search query instantly triggers targeted advertisements above
            organic results.
          </Text>
          <Text fontSize="18px" color="secondary" margin="0">
            Press <strong>→</strong> to open the interactive Google Search demo
          </Text>
        </FlexBox>
      </Slide>

      {/* Slide 2: Interactive Fake Google Search + Advertisement */}
      <Slide backgroundColor="#1e293b" padding="28px">
        <Box width="100%" height="100%">
          <FakeGoogleSlide />
        </Box>
      </Slide>

      {/* Slide 3: Key Takeaways / Anatomy */}
      <Slide backgroundColor="tertiary">
        <FlexBox height="100%" flexDirection="column" justifyContent="center" alignItems="flex-start" padding="0 64px">
          <Heading fontSize="44px" color="primary" margin="0 0 24px 0">
            Why Search Ads Work
          </Heading>
          <UnorderedList fontSize="24px" color="#cbd5e1">
            <ListItem margin="0 0 14px 0">
              <strong style={{ color: '#60a5fa' }}>High Intent:</strong> The ad appears at the exact
              moment the user asks for a product or solution.
            </ListItem>
            <ListItem margin="0 0 14px 0">
              <strong style={{ color: '#facc15' }}>Top-of-Page Placement:</strong> Sponsored text
              and product cards sit above organic results.
            </ListItem>
            <ListItem margin="0 0 14px 0">
              <strong style={{ color: '#34d399' }}>Rich Extensions:</strong> Promo badges, prices,
              ratings, and sitelinks boost click-through rate.
            </ListItem>
            <ListItem>
              <strong style={{ color: '#f87171' }}>Pay-Per-Click (PPC):</strong> Advertisers only
              pay when a user actually clicks the ad.
            </ListItem>
          </UnorderedList>
          <Text fontSize="18px" color="#94a3b8" margin="28px 0 0 0">
            Tip: Press <strong>←</strong> anytime to return and test another search query.
          </Text>
        </FlexBox>
      </Slide>
    </Deck>
  );
}
