/**
 * Content Moderation and Spam Detection Engine
 * Analyzes messages for spam, scams, phishing, abusive language, and inappropriate content.
 */

// Profanity & Abusive Language list (including normalized representations)
const INAPPROPRIATE_KEYWORDS = [
  "fuck", "fucker", "fucking", "fck", "f*ck", "shit", "bitch", "b!tch", "asshole",
  "dick", "pussy", "cunt", "bastard", "slut", "whore", "nigger", "nigga", "faggot",
  "retard", "kill yourself", "kys", "i will kill you", "die in a fire", "hang yourself",
  "terrorist", "bomb threat", "rape", "nazi", "hitler"
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
 * Analyzes content and returns detailed moderation flags, categories, and severity
 * @param {string} content - Raw message content
 * @param {Array} attachments - List of attachments
 * @returns {Object} Moderation result
 */
export function analyzeContent(content = "", attachments = []) {
  const cleanContent = typeof content === "string" ? content.trim() : "";
  const normalized = normalizeText(cleanContent);
  const lower = cleanContent.toLowerCase();

  const reasons = [];
  const categories = new Set();
  let severity = "clean";
  let spamScore = 0;
  let inappropriateScore = 0;
  const matchedPatterns = [];

  // 1. Check for Inappropriate / Abusive Content
  for (const word of INAPPROPRIATE_KEYWORDS) {
    const regex = new RegExp(`\\b${word.replace(/[*!]/g, "")}\\b`, "i");
    if (regex.test(normalized) || lower.includes(word)) {
      categories.add("Inappropriate Content");
      matchedPatterns.push(word);
      if (["kill yourself", "kys", "i will kill you", "die in a fire", "hang yourself", "nigger", "faggot", "rape"].includes(word)) {
        severity = "high";
        inappropriateScore += 50;
        reasons.push(`High-severity hate speech or threat detected: "${word}"`);
      } else {
        if (severity !== "high") severity = "medium";
        inappropriateScore += 25;
        reasons.push(`Inappropriate or abusive language detected: "${word}"`);
      }
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
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
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
