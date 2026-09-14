/**
 * Content Moderation and Spam Detection Engine
 * Analyzes messages for spam, scams, phishing, abusive language, and inappropriate content.
 *
 * Profanity detection runs on two local, zero-API-key npm libraries instead of a
 * single fixed word list — this catches obfuscation (f.u.c.k, f*ck, sh1t) and has
 * far broader dictionary coverage than a hand-maintained array:
 *   - leo-profanity: fast plain-dictionary match
 *   - glin-profanity: leetspeak / obfuscation-aware matching
 */
import leoProfanity from "leo-profanity";
import { Filter as GlinProfanityFilter } from "glin-profanity";

leoProfanity.loadDictionary("en");

const glinFilter = new GlinProfanityFilter({
  languages: ["english"],
  caseSensitive: false,
  allowObfuscatedMatch: false, // Prevents catastrophic false positives across random words
});

// Multi-word threats, hate speech, and self-harm phrases. These are phrase-level
// and severity-critical, so they stay as an explicit list even though single-word
// profanity is now handled by the libraries above.
const HIGH_SEVERITY_PHRASES = [
  "kill yourself", "kys", "i will kill you", "die in a fire", "hang yourself",
  "terrorist", "bomb threat", "rape", "nazi", "hitler",
];

// Spam, Phishing, & Scam triggers
const SPAM_KEYWORDS = [
  "free crypto", "crypto giveaway", "bitcoin giveaway", "send btc", "send eth",
  "guaranteed profit", "double your investment", "binary option", "forex signals",
  "claim your airdrop", "won a lottery", "congratulations you won", "claim your prize",
  "urgent transfer", "click here to claim", "bank account suspended", "verify your account immediately",
  "free giftcard", "free robux", "free nitro", "earn $1000 daily", "work from home make $",
  "contact on telegram", "dm me on telegram", "whatsapp me at +", "message me on whatsapp +"
];

// Suspicious URL domains & URL shorteners often used in spam / phishing
const SUSPICIOUS_DOMAINS = [
  "bit.ly", "tinyurl.com", "cutt.ly", "is.gd", "t.me", "wa.me",
  ".xyz", ".top", ".club", ".ru", ".buzz", ".work", ".click", ".loan", ".gq", ".cf", ".tk"
];

/**
 * Normalizes text to defeat simple leetspeak and punctuation obfuscation
 */
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[!|1]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[3]/g, "e")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deobfuscates single characters separated by punctuation or spaces (e.g. "f.u.c.k", "f u c k")
 */
function deobfuscateTokens(text) {
  if (!text) return "";
  return text.replace(
    /\b([a-zA-Z0-9])[\s\.\-_*]+([a-zA-Z0-9])[\s\.\-_*]+([a-zA-Z0-9])[\s\.\-_*]+([a-zA-Z0-9])\b/gi,
    (match, a, b, c, d) => a + b + c + d
  );
}

/**
 * Analyzes content and returns detailed moderation flags, categories, and severity
 * @param {string} content - Raw message content
 * @param {Array} attachments - List of attachments
 * @returns {Object} Moderation result
 */
export function analyzeContent(content = "", attachments = []) {
  const cleanContent = typeof content === "string" ? content.trim() : "";
  const normalized = normalizeText(cleanContent);
  const deobfuscated = deobfuscateTokens(cleanContent);
  const lower = cleanContent.toLowerCase();

  const reasons = [];
  const categories = new Set();
  let severity = "clean";
  let spamScore = 0;
  let inappropriateScore = 0;
  const matchedPatterns = [];

  // 1. Check for Inappropriate / Abusive Content (local libraries, no API key)
  const profaneWords = new Set();

  // Test both original content and deobfuscated version (catches f.u.c.k, f u c k)
  [cleanContent, deobfuscated].forEach((textToTest) => {
    if (leoProfanity.check(textToTest)) {
      const badWords = typeof leoProfanity.badWordsUsed === "function" ? leoProfanity.badWordsUsed(textToTest) : [];
      if (badWords && badWords.length > 0) {
        badWords.forEach((w) => profaneWords.add(w.toLowerCase()));
      } else {
        const censored = leoProfanity.clean(textToTest, "*");
        textToTest.split(/\s+/).forEach((word, i) => {
          const censoredWord = censored.split(/\s+/)[i];
          if (censoredWord && censoredWord.includes("*") && censoredWord !== word) {
            profaneWords.add(word.toLowerCase());
          }
        });
      }
    }

    const glinResult = glinFilter.checkProfanity(textToTest);
    if (glinResult?.containsProfanity) {
      (glinResult.profaneWords || []).forEach((w) => profaneWords.add(w.toLowerCase()));
    }
  });

  if (profaneWords.size > 0) {
    categories.add("Inappropriate Content");
    profaneWords.forEach((word) => {
      matchedPatterns.push(word);
      reasons.push(`Inappropriate or abusive language detected: "${word}"`);
    });
    if (severity !== "high") severity = "medium";
    inappropriateScore += 25 * profaneWords.size;
  }

  // High-severity threats / hate speech / self-harm phrases (phrase-level, not
  // covered by the word-based profanity libraries above)
  for (const phrase of HIGH_SEVERITY_PHRASES) {
    if (lower.includes(phrase) || normalized.includes(phrase)) {
      categories.add("Inappropriate Content");
      matchedPatterns.push(phrase);
      severity = "high";
      inappropriateScore += 50;
      reasons.push(`High-severity hate speech or threat detected: "${phrase}"`);
    }
  }

  // 2. Check for Spam / Crypto / Phishing Scams
  for (const spamPhrase of SPAM_KEYWORDS) {
    if (lower.includes(spamPhrase)) {
      categories.add("Spam & Scam");
      matchedPatterns.push(spamPhrase);
      spamScore += 40;
      reasons.push(`Scam/solicitation keyword pattern detected: "${spamPhrase}"`);
      if (severity !== "high") severity = "high";
    }
  }

  // 3. Check for Suspicious Links / Shorteners
  // Matches both full URLs (https://...) and bare domains (bit.ly/xyz, example.xyz)
  // so protocol-less links shared in chat don't slip past the check.
  const urlRegex = /((https?:\/\/)?(www\.)?[a-z0-9-]+\.[a-z]{2,}(\/[^\s]*)?)/gi;
  const urls = cleanContent.match(urlRegex) || [];
  if (urls.length > 0) {
    let suspiciousUrlCount = 0;
    for (const url of urls) {
      const lowerUrl = url.toLowerCase();
      for (const domain of SUSPICIOUS_DOMAINS) {
        if (lowerUrl.includes(domain)) {
          suspiciousUrlCount++;
          categories.add("Suspicious Link");
          matchedPatterns.push(domain);
          reasons.push(`Suspicious domain or URL shortener detected: "${url}"`);
        }
      }
    }

    if (suspiciousUrlCount > 0) {
      spamScore += 35;
      if (severity === "clean") severity = "medium";
    }

    // High URL-to-text density is typical spam behavior
    if (urls.length >= 3) {
      categories.add("Spam & Scam");
      spamScore += 25;
      reasons.push(`Excessive link flooding detected (${urls.length} URLs in message)`);
      if (severity === "clean") severity = "medium";
    }
  }

  // 4. Repeated Characters / Token Flooding Spam
  // E.g. "aaaaaaaaaaaa" or repeated words > 5 times
  const repeatedCharRegex = /(.)\1{9,}/;
  if (repeatedCharRegex.test(cleanContent)) {
    categories.add("Spam & Scam");
    spamScore += 20;
    reasons.push("Excessive character repetition (flooding)");
    if (severity === "clean") severity = "low";
  }

  // Check repeating words: e.g. "buy buy buy buy buy buy"
  const words = cleanContent.split(/\s+/).filter(Boolean);
  if (words.length >= 6) {
    const freq = {};
    for (const w of words) {
      const lw = w.toLowerCase();
      freq[lw] = (freq[lw] || 0) + 1;
      if (freq[lw] >= 5) {
        categories.add("Spam & Scam");
        spamScore += 20;
        reasons.push(`Repetitive word flooding detected ("${w}")`);
        if (severity === "clean") severity = "low";
        break;
      }
    }
  }

  // 5. Excessive Uppercase (Shouting / Spam heuristic)
  if (cleanContent.length > 25) {
    const letters = cleanContent.replace(/[^a-zA-Z]/g, "");
    if (letters.length > 15) {
      const uppercaseCount = letters.split("").filter((c) => c === c.toUpperCase()).length;
      const ratio = uppercaseCount / letters.length;
      if (ratio > 0.85) {
        spamScore += 15;
        reasons.push("Excessive capitalization (>85% uppercase)");
        if (severity === "clean") severity = "low";
      }
    }
  }

  // 6. Suspicious Phone / Contact Harvesting
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  const phones = cleanContent.match(phoneRegex);
  if (phones && (lower.includes("call") || lower.includes("whatsapp") || lower.includes("text me"))) {
    categories.add("Spam & Scam");
    spamScore += 25;
    reasons.push("Direct contact harvesting pattern detected with phone number");
    if (severity === "clean") severity = "medium";
  }

  const isFlagged = categories.size > 0 || reasons.length > 0;
  const totalScore = Math.min(100, spamScore + inappropriateScore);

  if (isFlagged && severity === "clean") {
    severity = totalScore >= 50 ? "high" : totalScore >= 25 ? "medium" : "low";
  }

  return {
    isFlagged,
    severity, // 'high' | 'medium' | 'low' | 'clean'
    score: totalScore,
    categories: Array.from(categories),
    reasons,
    matchedPatterns: Array.from(new Set(matchedPatterns)),
    spamScore,
    inappropriateScore,
  };
}

const FLOOD_WINDOW_MS = 60 * 1000; // repeated/rapid messages within this window count as flooding
const FLOOD_DUPLICATE_LIMIT = 3; // same sender, same normalized text, this many times = flood
const FLOOD_RATE_LIMIT = 8; // same sender, any content, this many messages in the window = flood

/**
 * Detects cross-message spam patterns that a single message can't reveal on its
 * own: a sender repeating the same message, or posting a burst of messages in a
 * short window. Runs entirely locally over already-fetched messages — no extra
 * DB calls, no external API.
 *
 * @param {Array<{_id, sender, content, createdAt}>} messages - Same shape as what
 *   Message.find() returns (sender can be a populated doc or an id).
 * @returns {Map<string, {isFlooding: boolean, reason: string}>} keyed by message _id
 */
export function detectFloodPatterns(messages = []) {
  const results = new Map();

  // Group by sender, sorted oldest -> newest so we can do a rolling-window scan
  const bySender = new Map();
  for (const msg of messages) {
    const senderId = (msg.sender?._id || msg.sender || "unknown").toString();
    if (!bySender.has(senderId)) bySender.set(senderId, []);
    bySender.get(senderId).push(msg);
  }

  for (const [, senderMessages] of bySender) {
    const sorted = [...senderMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const currentTime = new Date(current.createdAt).getTime();
      const normalizedCurrent = normalizeText(current.content || "");

      // Look back within the flood window
      const windowMsgs = sorted.filter((m) => {
        const t = new Date(m.createdAt).getTime();
        return t <= currentTime && currentTime - t <= FLOOD_WINDOW_MS;
      });

      const duplicateCount = windowMsgs.filter(
        (m) => normalizeText(m.content || "") === normalizedCurrent && normalizedCurrent.length > 0
      ).length;

      if (duplicateCount >= FLOOD_DUPLICATE_LIMIT) {
        results.set(current._id.toString(), {
          isFlooding: true,
          reason: `Sender repeated this message ${duplicateCount} times within ${FLOOD_WINDOW_MS / 1000}s`,
        });
        continue;
      }

      if (windowMsgs.length >= FLOOD_RATE_LIMIT) {
        results.set(current._id.toString(), {
          isFlooding: true,
          reason: `Sender posted ${windowMsgs.length} messages within ${FLOOD_WINDOW_MS / 1000}s`,
        });
      }
    }
  }

  return results;
}
