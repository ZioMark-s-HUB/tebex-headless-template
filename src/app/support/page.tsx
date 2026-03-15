import { type ReactNode } from "react";
import { ExternalLink, Mail, MessageSquare, ShieldCheck } from "lucide-react";

import { siteConfig } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SupportCard = {
  icon: ReactNode;
  title: string;
  description: string;
  link?: { href: string; label: string; external?: boolean };
};

function buildCards(): SupportCard[] {
  const cards: SupportCard[] = [];

  if (siteConfig.supportEmail) {
    cards.push({
      icon: <Mail className="h-4 w-4" />,
      title: "Email",
      description: "Send us an email and we'll get back to you as soon as possible.",
      link: {
        href: `mailto:${siteConfig.supportEmail}`,
        label: siteConfig.supportEmail,
      },
    });
  }

  if (siteConfig.discordUrl) {
    cards.push({
      icon: <MessageSquare className="h-4 w-4" />,
      title: "Discord",
      description: "Join our Discord server and open a support ticket.",
      link: {
        href: siteConfig.discordUrl,
        label: "Join Discord",
        external: true,
      },
    });
  }

  cards.push({
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Billing",
    description:
      "For payment disputes, refunds, or charge-related questions, visit the Tebex billing portal linked in your purchase confirmation email.",
  });

  return cards;
}

export default function SupportPage() {
  const cards = buildCards();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">
          Need help with a purchase, delivery, or payment issue? Reach out via
          the channels below.
        </p>
      </section>

      <div className={`grid gap-4 ${cards.length >= 3 ? "md:grid-cols-3" : cards.length === 2 ? "md:grid-cols-2" : ""}`}>
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {card.icon}
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{card.description}</p>
              {card.link && (
                <a
                  href={card.link.href}
                  {...(card.link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {card.link.label}
                  {card.link.external && <ExternalLink className="h-3 w-3" />}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
