const form = document.getElementById("promptForm");
const questionInput = document.getElementById("question");
const languageInput = document.getElementById("language");
const output = document.getElementById("output");
const functionList = document.getElementById("functionList");
const rawOutput = document.getElementById("rawOutput");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

function setStatus(message, isBusy) {
  statusEl.textContent = message;
  submitBtn.disabled = isBusy;
}

function renderEmpty() {
  output.innerHTML = "<p class=\"empty\">No response yet.</p>";
  functionList.innerHTML = "<li class=\"empty\">No functions yet.</li>";
  rawOutput.textContent = "No code yet.";
  copyBtn.disabled = true;
}

function renderFunctions(functionCalls) {
  functionList.innerHTML = "";
  if (!Array.isArray(functionCalls) || functionCalls.length === 0) {
    functionList.innerHTML = "<li class=\"empty\">No functions found.</li>";
    return;
  }
  functionCalls.forEach((func) => {
    const item = document.createElement("li");
    item.innerHTML = `<a href="${func.url}">${func.name}</a>`;
    functionList.appendChild(item);
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  const question = questionInput.value.trim();
  const language = languageInput.value;

  if (!question) {
    setStatus("Enter a prompt to continue", false);
    return;
  }

  setStatus("Sending request...", true);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.error || "Request failed";
      throw new Error(message);
    }

    const data = await response.json();
    output.innerHTML = data.html || "<p class=\"empty\">No HTML returned.</p>";
    renderFunctions(data.functionCalls);
    rawOutput.textContent = data.raw || "No code returned.";
    copyBtn.disabled = !data.raw;
    setStatus("Done", false);
  } catch (error) {
    output.innerHTML = `<p class=\"empty\">${error.message}</p>`;
    renderFunctions([]);
    rawOutput.textContent = "No code returned.";
    copyBtn.disabled = true;
    setStatus("Error", false);
  }
}

form.addEventListener("submit", handleSubmit);
clearBtn.addEventListener("click", () => {
  questionInput.value = "";
  renderEmpty();
  setStatus("Idle", false);
});
copyBtn.addEventListener("click", async () => {
  const text = rawOutput.textContent;
  if (!text || text === "No code yet." || text === "No code returned.") {
    setStatus("Nothing to copy", false);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied", false);
  } catch (error) {
    setStatus("Copy failed", false);
  }
});

renderEmpty();
