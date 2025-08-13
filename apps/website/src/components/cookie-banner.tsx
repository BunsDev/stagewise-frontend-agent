'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@stagewise/ui/components/card';
import { Button } from '@stagewise/ui/components/button';

const CONSENT_KEY = 'posthog-consent';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === null) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setShowBanner(false);
    // Reload the page to reinitialize PostHog with cookies
    window.location.reload();
  };

  const handleDeny = () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="slide-in-from-bottom fixed right-4 bottom-4 z-50 w-sm animate-in rounded-xl bg-fd-background/80 backdrop-blur-lg duration-300">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cookie Consent</CardTitle>
          <CardDescription className="text-sm">
            We use analytics cookies to understand how you use our website and
            improve your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeny}
            className="flex-1"
          >
            Deny
          </Button>
          <Button size="sm" onClick={handleAccept} className="flex-1">
            Accept
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
