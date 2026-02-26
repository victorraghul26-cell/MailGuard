document.addEventListener("DOMContentLoaded", function () {

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

        chrome.tabs.sendMessage(tabs[0].id, {action: "getEmailData"}, function(emailData) {

            if (!emailData) return;

            fetch("http://127.0.0.1:8000/analyze", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(emailData)
            })
            .then(res => res.json())
            .then(data => {

                document.getElementById("score").innerText =
                    "Risk Score: " + data.risk_score + "/100";

                document.getElementById("level").innerText =
                    "Risk Level: " + data.risk_level;

                document.getElementById("guidance").innerText =
                    data.guidance;

                let signalList = document.getElementById("signals");
                signalList.innerHTML = "";

                data.explanations.forEach(signal => {
                    let li = document.createElement("li");
                    li.innerText = "⚠ " + signal;
                    signalList.appendChild(li);
                });
            });
        });
    });
});