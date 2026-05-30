import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

let db: any = null;
try {
  // Пытаемся найти конфигурацию Firebase
  const configPath1 = path.join(process.cwd(), 'firebase-applet-config.json');
  const configPath2 = path.join(__dirname, '..', 'firebase-applet-config.json');
  const configPath = fs.existsSync(configPath1) ? configPath1 : configPath2;
  
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully on Vercel");
  } else if (process.env.FIREBASE_CONFIG) {
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  }
} catch (e) {
  console.error("Failed to initialize Firebase:", e);
}

// Резервное хранилище в ОЗУ (если Firebase не подключен)
const urlDbFallback = new Map<string, string>();

app.post("/api/shorten", async (req, res) => {
  const { url, domain } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Please provide a valid URL" });
  }

  const id = crypto.randomBytes(4).toString("base64url").substring(0, 6);
  
  if (db) {
    try {
      await setDoc(doc(db, "urls", id), { url });
    } catch (err) {
      console.error("Firestore error:", err);
      return res.status(500).json({ error: "Database error" });
    }
  } else {
    urlDbFallback.set(id, url);
  }

  let baseUrl = `https://${domain || req.get("host")}`;
  const shortUrl = `${baseUrl}/${id}`;
  res.json({ id, shortUrl, originalUrl: url });
});

app.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  
  if (id === "api" || id.startsWith("@") || id.includes(".") || id.startsWith("src")) {
    return next();
  }

  let originalUrl: string | null = null;
  
  if (db) {
    try {
      const snap = await getDoc(doc(db, "urls", id));
      if (snap.exists()) {
        originalUrl = snap.data().url as string;
      }
    } catch (err) {
      console.error("Firestore fetch error:", err);
    }
  } else {
    originalUrl = urlDbFallback.get(id) || null;
  }

  if (originalUrl) {
    return res.redirect(301, originalUrl);
  }
  
  res.status(404).send("URL not found");
});

export default app;
