from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- CONFIG ----------------

URGENCY = ["urgent", "immediately", "within", "act now", "expires"]
FEAR = ["suspended", "compromised", "locked", "final warning", "permanent"]
AUTHORITY = ["bank", "security team", "irs", "microsoft", "google"]
GENERIC = ["dear customer", "dear user", "account holder"]

INTENT_PHRASES = [
    "confirm identity",
    "verify account",
    "review account",
    "access dashboard",
    "validate information",
    "security update",
    "account review"
]

LOGIN_PATTERNS = ["login", "verify", "auth", "secure", "account", "dashboard"]

SUSPICIOUS_TLDS = [".xyz", ".ru", ".tk", ".ml"]
TRUSTED_DOMAINS = ["google.com", "amazon.com", "microsoft.com"]

# ---------------- HELPERS ----------------

def count_occurrences(text, word_list):
    text = text.lower()
    return sum(text.count(word) for word in word_list)

def extract_domains(links):
    domains = []
    for l in links:
        try:
            domains.append(urlparse(l).netloc.lower())
        except:
            pass
    return domains

def link_contains_pattern(links, patterns):
    for link in links:
        for p in patterns:
            if p in link.lower():
                return True
    return False

# ---------------- MAIN ----------------

@app.post("/analyze")
def analyze(data: dict):

    body = data.get("body", "").lower()
    sender = data.get("sender_email", "").lower()
    links = data.get("links", [])

    psychological_score = 0
    technical_score = 0
    trust_score = 0

    psychological_tactics = []
    technical_flags = []
    trust_signals = []
    why_not_100 = []

    # ---------- Psychological (Frequency Based) ----------

    urgency_count = count_occurrences(body, URGENCY)
    fear_count = count_occurrences(body, FEAR)
    authority_count = count_occurrences(body, AUTHORITY)
    generic_count = count_occurrences(body, GENERIC)
    intent_count = count_occurrences(body, INTENT_PHRASES)

    if urgency_count > 0:
        psychological_score += urgency_count * 6
        psychological_tactics.append("Urgency Manipulation")

    if fear_count > 0:
        psychological_score += fear_count * 6
        psychological_tactics.append("Fear-Based Pressure")

    if authority_count > 0:
        psychological_score += authority_count * 5
        psychological_tactics.append("Authority Exploitation")

    if generic_count > 0:
        psychological_score += generic_count * 4
        psychological_tactics.append("Generic Greeting Strategy")

    if intent_count > 0:
        psychological_score += intent_count * 15
        psychological_tactics.append("Credential Harvesting Intent")

        # ---------- Technical ----------

    sender_domain = sender.split("@")[-1] if "@" in sender else ""
    link_domains = extract_domains(links)

    if any(sender_domain.endswith(t) for t in SUSPICIOUS_TLDS):
        technical_score += 18
        technical_flags.append("Suspicious Domain Extension")

    if link_domains and not any(sender_domain in d for d in link_domains):
        technical_score += 12
        technical_flags.append("Sender-Link Domain Mismatch")

    if len(link_domains) > 2:
        technical_score += 6
        technical_flags.append("Multiple Embedded Links")

    login_detected = link_contains_pattern(links, LOGIN_PATTERNS)
    if login_detected:
        technical_score += 20
        technical_flags.append("Login-Style Link Detected")

    # ---------- Trust Signals ----------

    if any(t in sender_domain for t in TRUSTED_DOMAINS):
        trust_score -= 15
        trust_signals.append("Trusted Provider Domain")
        why_not_100.append("Sender domain appears legitimate")

    if link_domains and any(sender_domain in d for d in link_domains):
        trust_score -= 10
        trust_signals.append("Link matches sender domain")
        why_not_100.append("Links consistent with sender")

    if urgency_count == 0 and fear_count == 0:
        why_not_100.append("No strong urgency or fear tactics detected")

    if not technical_flags:
        why_not_100.append("No severe technical anomalies found")

    # ---------- Final Score ----------

    final_score = psychological_score + technical_score + trust_score
    final_score = max(0, min(final_score, 100))

    if final_score < 35:
        level = "Low"
    elif final_score < 70:
        level = "Medium"
    else:
        level = "High"

    # ---------- Attack Type Classification ----------

    if intent_count > 0 or link_contains_pattern(links, LOGIN_PATTERNS):
        attack_type = "Credential Harvesting"
    elif count_occurrences(body, ["payment", "invoice", "transfer"]) > 0:
        attack_type = "Financial Fraud"
    elif count_occurrences(body, ["download", "attachment", "install"]) > 0:
        attack_type = "Malware Delivery"
    else:
        attack_type = "Social Engineering"

    # ---------- Confidence (More Dynamic) ----------

    signal_strength = psychological_score + technical_score
    confidence_value = min(95, 55 + int(signal_strength / 4))

    # ---------- AI Explanation ----------

    ai_explanation = (
        f"The message contains {urgency_count + fear_count + authority_count} psychological cues "
        f"and {len(technical_flags)} technical risk indicators. "
        f"Behavioral patterns suggest a potential {attack_type} attempt."
    )

    gmail_bypass_reason = (
        "The email may bypass traditional spam filters because it does not "
        "contain known malware signatures or blacklisted URLs."
    )

    educational_tip = (
        "Attackers often use subtle authority or account review language "
        "to appear legitimate. Always verify sensitive requests independently."
    )

    # ---------- Recommended Action ----------

    if level == "High":
        recommended_action = "Do NOT click links. Independently verify the sender."
    elif level == "Medium":
        recommended_action = "Verify sender before interacting with any links."
    else:
        recommended_action = "Proceed normally but remain cautious."

    return {
        "risk_score": final_score,
        "risk_level": level,
        "psychological_score": psychological_score,
        "technical_score": technical_score,
        "trust_score": trust_score,
        "psychological_tactics": psychological_tactics,
        "technical_flags": technical_flags,
        "trust_signals": trust_signals,
        "attack_type": attack_type,
        "ai_explanation": ai_explanation,
        "confidence": f"{confidence_value}%",
        "why_not_100": why_not_100,
        "gmail_bypass_reason": gmail_bypass_reason,
        "educational_tip": educational_tip,
        "recommended_action": recommended_action
    }
    
