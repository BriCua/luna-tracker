import { Router } from "express";
import type { Request, Response } from "express";
import db from "../db/index.js";

const router = Router();

router.get("/vapid-public-key", (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY;

  if (!key) {
    res
      .status(500)
      .json({ error: "VAPID public key not configured on server." });
    return;
  }

  res.json({ key });
});

router.post("/subscribe", (req: Request, res: Response) => {
  const { endpoint, keys } = req.body as {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription object." });
    return;
  }

  db.prepare(
    `
    INSERT INTO push_subscriptions (endpoint, p256dh, auth)
    VALUES (?, ?, ?)
    ON CONFLICT (endpoint) DO UPDATE SET
      p256dh = excluded.p256dh,
      auth   = excluded.auth
  `,
  ).run(endpoint, keys.p256dh, keys.auth);

  res.status(201).json({ ok: true });
});

router.delete("/unsubscribe", (req: Request, res: Response) => {
  const { endpoint } = req.body as { endpoint: string };

  if (!endpoint) {
    res.status(400).json({ error: "endpoint is required." });
    return;
  }

  const result = db
    .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
    .run(endpoint);

  if (result.changes === 0) {
    res.status(404).json({ error: "Subscription not found." });
    return;
  }

  res.json({ ok: true });
});

export default router;
