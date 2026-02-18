import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { blogPosts } from "@shared/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://thevoid.replit.app";

const ROUTE_META: Record<string, { title: string; description: string; ogTitle: string; ogDescription: string }> = {
  "/": {
    title: "THE VOID — Scream Into the Abyss | Voice Venting App by DarkWave Studios",
    description: "THE VOID is a safe, cathartic space to blow off steam. Record your frustrations and get AI-powered responses from 5 unique personalities. Built by DarkWave Studios.",
    ogTitle: "THE VOID — Scream Into the Abyss",
    ogDescription: "A safe, cathartic space to blow off steam. Vent your frustrations and get AI-powered responses from 5 unique personalities.",
  },
  "/mission": {
    title: "From the Void — Our Mission | DarkWave Studios",
    description: "THE VOID by DarkWave Studios — a voice-first venting platform built for catharsis, connection, and emotional wellness. Learn about our mission.",
    ogTitle: "From the Void — Our Mission",
    ogDescription: "We built a place to scream. Learn about the mission behind THE VOID.",
  },
  "/blog": {
    title: "Blog — Mental Wellness Insights | THE VOID",
    description: "AI-curated articles on emotional health, stress management, breathing techniques, and mental wellness from THE VOID.",
    ogTitle: "Void Blog — Mental Wellness Insights",
    ogDescription: "Expert insights on venting, stress relief, and emotional intelligence.",
  },
  "/zen": {
    title: "Zen Zone — Meditation & Calm | THE VOID",
    description: "Guided breathing exercises, ambient sounds, and meditation timers to find your calm. Box breathing, 4-7-8 method, and more.",
    ogTitle: "Zen Zone — Find Your Calm",
    ogDescription: "Breathing exercises, ambient sounds, and guided meditation.",
  },
  "/contact": {
    title: "Contact Us | THE VOID by DarkWave Studios",
    description: "Questions, feedback, or just want to say hi — reach out to the DarkWave Studios team behind THE VOID.",
    ogTitle: "Contact THE VOID",
    ogDescription: "Get in touch with the DarkWave Studios team.",
  },
  "/signal": {
    title: "Signal Chat | THE VOID Community",
    description: "Join THE VOID community chat. Connect with others, share experiences, and access crisis resources. Powered by Trust Layer SSO.",
    ogTitle: "Signal Chat — THE VOID Community",
    ogDescription: "Real-time community chat powered by Trust Layer SSO.",
  },
  "/privacy": {
    title: "Privacy Policy | THE VOID by DarkWave Studios",
    description: "How THE VOID collects, uses, and protects your data. Our commitment to privacy and security.",
    ogTitle: "Privacy Policy — THE VOID",
    ogDescription: "Your privacy matters. Learn how we protect your data.",
  },
  "/terms": {
    title: "Terms of Service | THE VOID by DarkWave Studios",
    description: "Terms and conditions for using THE VOID voice venting application by DarkWave Studios.",
    ogTitle: "Terms of Service — THE VOID",
    ogDescription: "Terms and conditions for using THE VOID.",
  },
  "/progress": {
    title: "Your Progress — Streaks & Achievements | THE VOID",
    description: "Track your venting streak, unlock achievements, monitor mood trends, and get daily prompts.",
    ogTitle: "Your Progress — THE VOID",
    ogDescription: "Streaks, achievements, and mood tracking for your emotional journey.",
  },
};

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  function injectMeta(html: string, meta: { title: string; description: string; ogTitle: string; ogDescription: string }, routePath: string): string {
    return html
      .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
      .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${meta.description}"`)
      .replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${meta.ogTitle}"`)
      .replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${meta.ogDescription}"`)
      .replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="${meta.ogTitle}"`)
      .replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="${meta.ogDescription}"`)
      .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="${BASE_URL}${routePath === "/" ? "" : routePath}"`);
  }

  app.use("/{*path}", async (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(indexPath, "utf-8");

    const routePath = _req.path;
    const meta = ROUTE_META[routePath];

    if (meta) {
      html = injectMeta(html, meta, routePath);
    } else if (routePath.startsWith("/blog/")) {
      const slug = routePath.replace("/blog/", "");
      try {
        const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
        if (post) {
          const excerpt = post.excerpt || post.content?.substring(0, 160) || "";
          html = injectMeta(html, {
            title: `${post.title} — THE VOID Blog`,
            description: excerpt,
            ogTitle: `${post.title} — THE VOID Blog`,
            ogDescription: excerpt,
          }, routePath);
        }
      } catch (e) {
        // Fall through to default meta
      }
    }

    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });
}
