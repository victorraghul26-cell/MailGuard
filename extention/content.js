function injectButton() {

    if (document.getElementById("analyzeBtn")) return;

    let btn = document.createElement("button");
    btn.id = "analyzeBtn";
    btn.innerText = "Analyze Email";

    btn.style.position = "fixed";
    btn.style.bottom = "30px";
    btn.style.right = "30px";
    btn.style.background = "#dc2626";
    btn.style.color = "white";
    btn.style.padding = "14px 22px";
    btn.style.borderRadius = "50px";
    btn.style.border = "none";
    btn.style.fontWeight = "bold";
    btn.style.cursor = "pointer";
    btn.style.zIndex = "9999";
    btn.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)";

    btn.onclick = analyzeEmail;
    document.body.appendChild(btn);
}

function extractEmail() {

    let sender = document.querySelector("span[email]");
    let subject = document.querySelector("h2.hP");
    let body = document.querySelector("div.a3s");

    if (!body) {
        alert("Open an email first.");
        return null;
    }

    let links = [];
    body.querySelectorAll("a").forEach(l => {
        if (l.href) links.push(l.href);
    });

    return {
        sender_email: sender ? sender.getAttribute("email") : "",
        subject: subject ? subject.innerText : "",
        body: body.innerText,
        links: links
    };
}

function analyzeEmail() {

    let email = extractEmail();
    if (!email) return;

    fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email)
    })
    .then(res => res.json())
    .then(data => showOverlay(data))
    .catch(() => alert("Backend not running!"));
}

function showOverlay(data) {

    let glowColor = "#10b981";
    if (data.risk_level === "Medium") glowColor = "#f59e0b";
    if (data.risk_level === "High") glowColor = "#ef4444";

    let overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "10000";

    let card = document.createElement("div");
    card.style.background = "#0f172a";
    card.style.color = "white";
    card.style.width = "650px";
    card.style.maxHeight = "90vh";
    card.style.overflowY = "auto";
    card.style.padding = "30px";
    card.style.borderRadius = "20px";
    card.style.fontFamily = "Arial";
    card.style.boxShadow = `0 0 40px ${glowColor}`;

    card.innerHTML = `
        <h2>Harm Likelihood</h2>
        <div id="scoreText" style="font-size:48px;font-weight:bold;">0 / 100</div>

        <div style="height:12px;background:#1e293b;border-radius:10px;margin:10px 0 20px 0;">
            <div id="mainBar" style="height:12px;width:0%;background:${glowColor};border-radius:10px;transition:width 1s;"></div>
        </div>

        <div style="margin-bottom:20px;font-weight:bold;">
            ${data.risk_level} Risk | Confidence: ${data.confidence}
        </div>

        <h3>Score Breakdown</h3>
        <p>Psychological Score: ${data.psychological_score}</p>
        <p>Technical Score: ${data.technical_score}</p>
        <p>Trust Deduction: ${data.trust_score}</p>

        <h3 style="margin-top:25px;">Psychological Tactics</h3>
        <ul>${data.psychological_tactics.map(s => `<li>🧠 ${s}</li>`).join("")}</ul>

        <h3 style="margin-top:20px;">Technical Flags</h3>
        <ul>${data.technical_flags.map(s => `<li>⚙ ${s}</li>`).join("")}</ul>

        <h3 style="margin-top:20px;">Trust Signals</h3>
        <ul>${data.trust_signals.map(s => `<li>✔ ${s}</li>`).join("")}</ul>

        <h3 style="margin-top:25px;">Attack Type Classification</h3>
        <p>${data.attack_type}</p>

        <h3 style="margin-top:25px;">AI Intent Explanation</h3>
        <p>${data.ai_explanation}</p>

        <h3 style="margin-top:25px;">Why Not 100?</h3>
        <ul>${data.why_not_100.map(s => `<li>${s}</li>`).join("")}</ul>

        <h3 style="margin-top:25px;">Why Gmail May Not Block This</h3>
        <p>${data.gmail_bypass_reason}</p>

        <h3 style="margin-top:25px;">Educational Insight</h3>
        <p>${data.educational_tip}</p>

        <div style="margin-top:25px;padding:15px;border-radius:12px;background:rgba(239,68,68,0.15);color:${glowColor};font-weight:bold;">
            Recommended Action: ${data.recommended_action}
        </div>

        <button id="closeOverlay"
            style="margin-top:30px;width:100%;padding:15px;border:none;border-radius:12px;background:#334155;color:white;font-size:16px;cursor:pointer;">
            Close
        </button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Animate score
    let current = 0;
    let target = data.risk_score;
    let scoreText = document.getElementById("scoreText");
    let mainBar = document.getElementById("mainBar");

    let interval = setInterval(() => {
        if (current >= target) {
            clearInterval(interval);
        } else {
            current++;
            scoreText.innerText = current + " / 100";
        }
    }, 8);

    setTimeout(() => {
        mainBar.style.width = target + "%";
    }, 200);

    document.getElementById("closeOverlay").onclick = () => overlay.remove();
}

window.addEventListener("load", () => {
    setTimeout(injectButton, 2000);
});