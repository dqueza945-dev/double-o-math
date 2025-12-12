// DAVID QUEZADA - CSCI250 FINAL PROJECT
// my api key (shhh)

const API_KEY = "paste-your-real-key-here-when-running-locally";

const solveButton = document.getElementById("solveBtn");
const quizButton = document.getElementById("quizBtn");
const inputBox = document.getElementById("problemInput");
const outputDiv = document.getElementById("output");
const loadingThing = document.getElementById("loading");
const historyArea = document.getElementById("historyList");
const clearBtn = document.getElementById("clearHistory");

// my custom prompt 
const myPrompt = `You are a super nice and funny math tutor. 
Always explain every step in detail and simple like you're teaching a friend.
At the very end, just write the final answer like this:
*Final Answer: 42*
(just bold text). Also make boold and italicized anything else important. Be encouraging and chill!`;

async function sendToChatGPT(userProblem) {
  loadingThing.classList.remove("hidden");
  outputDiv.innerHTML = "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: myPrompt },
          { role: "user", content: userProblem }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "something broke");

    const answer = data.choices[0].message.content;

    // wait for marked.js if it's still loading
    if (typeof marked === "undefined") {
      outputDiv.innerHTML = "<p>loading parser...</p>";
      await new Promise(resolve => {
        const check = () => typeof marked !== "undefined" ? resolve() : setTimeout(check, 100);
        check();
      });
    }

    outputDiv.innerHTML = marked.parse(answer);
    MathJax.typesetPromise();

    // save to history (we don't care about \\boxed anymore)
    saveHistory(userProblem, answer);

  } catch (error) {
    outputDiv.innerHTML = `<p style="color:red;font-weight:bold">Error: ${error.message}</p>`;
  } finally {
    loadingThing.classList.add("hidden");
  }
}

// buttons
solveButton.addEventListener("click", () => {
  const problem = inputBox.value.trim();
  if (!problem) { alert("dude type something"); return; }
  sendToChatGPT(problem);
});

quizButton.addEventListener("click", () => {
  const topic = prompt("what topic you want?", "quadratics");
  if (topic) sendToChatGPT(`make 5 practice problems about ${topic} with full solutions pls`);
});

// HISTORY STUFF
function saveHistory(problem, rawAnswer) {
  const shortProblem = problem.length > 80 ? problem.slice(0,80)+"..." : problem;
  const shortAnswer = rawAnswer.replace(/<[^>]*>/g, "").replace(/\*\*|__|\\/g, "").slice(0,150) + "...";

  let oldHistory = JSON.parse(localStorage.getItem("mathHistory") || "[]");
  oldHistory.unshift({ prob: shortProblem, ans: shortAnswer, when: new Date().toLocaleString() });
  if (oldHistory.length > 10) oldHistory.pop();
  localStorage.setItem("mathHistory", JSON.stringify(oldHistory));
  showHistory();
}

function showHistory() {
  const saved = JSON.parse(localStorage.getItem("mathHistory") || "[]");
  if (saved.length === 0) {
    historyArea.innerHTML = "<p style='color:gray'>nothing here yet bro...</p>";
    return;
  }
  historyArea.innerHTML = saved.map(item => `
    <div style="border-left:5px solid #6366f1;padding-left:10px;margin:10px 0;background:#f9f9f9;padding:10px;border-radius:8px">
      <b>${item.prob}</b><br>
      <small>${item.ans}</small><br>
      <small style="color:#888">${item.when}</small>
    </div>
  `).join("");
}

clearBtn.onclick = () => {
  if (confirm("delete all history?")) {
    localStorage.removeItem("mathHistory");
    showHistory();
  }
};

// show history when page loads
showHistory();

// load marked.js
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
document.head.appendChild(script);

// clear buttton - wipes everything
document.getElementById("clearBtn").addEventListener("click", () => {
  inputBox.value = "";           // clear the text box
  outputDiv.innerHTML = "";      // clear the answer
  loadingThing.classList.add("hidden"); // hide spinner just in case
});