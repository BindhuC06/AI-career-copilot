const API_URL = "/analyze";
const $ = (id) => document.getElementById(id);
const resume = $("resume");
const dropzone = $("dropzone");
const fileName = $("file-name");
const error = $("error");
const analyze = $("analyze");
const github = $("github");
const resultStatus = $("result-status");

const arr = (x) => Array.isArray(x) ? x.filter(Boolean) : (typeof x === "string" && x.trim() ? [x.trim()] : []);

function showError(message) {
  error.textContent = message || "";
}

function validateFile(file) {
  if (!file) return "Please upload your resume PDF.";
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please upload a PDF resume.";
  if (file.size > 20 * 1024 * 1024) return "Resume must be smaller than 20 MB.";
  return "";
}

function setFile(file) {
  showError("");
  const problem = validateFile(file);
  if (problem) {
    resume.value = "";
    fileName.textContent = "No file selected";
    fileName.classList.remove("selected");
    showError(problem);
    return false;
  }
  fileName.textContent = file.name;
  fileName.classList.add("selected");
  return true;
}

resume.addEventListener("change", () => setFile(resume.files[0]));

// The input covers the dropzone, so clicking anywhere opens the native picker.
["dragenter", "dragover"].forEach((name) => dropzone.addEventListener(name, (e) => {
  e.preventDefault(); e.stopPropagation(); dropzone.classList.add("dragging");
}));
["dragleave", "drop"].forEach((name) => dropzone.addEventListener(name, (e) => {
  e.preventDefault(); e.stopPropagation(); dropzone.classList.remove("dragging");
}));
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    resume.files = dt.files;
  } catch (_) {}
  setFile(file);
});

function renderList(id, items, empty) {
  const el = $(id);
  el.innerHTML = "";
  const values = arr(items);
  if (!values.length) {
    el.innerHTML = `<li class="empty">${empty}</li>`;
    return;
  }
  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    el.appendChild(li);
  });
}

function renderSkills(items) {
  const el = $("skills-list");
  el.innerHTML = "";
  const values = arr(items);
  if (!values.length) {
    el.innerHTML = '<span class="empty">Analyze to discover your skills.</span>';
    return;
  }
  values.forEach((value) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = value;
    el.appendChild(tag);
  });
}

function getScore(data) {
  const supplied = Number(data.readiness_score ?? data.readinessScore ?? data.score);
  if (Number.isFinite(supplied)) return Math.max(0, Math.min(100, Math.round(supplied)));
  const skills = arr(data.skills).length;
  const strengths = arr(data.strengths).length;
  const gaps = arr(data.skill_gaps ?? data.skillGaps).length;
  const actions = arr(data.recommendations).length;
  return Math.max(0, Math.min(100, Math.round(40 + skills * 5 + strengths * 3 + actions * 2 - gaps * 3)));
}

function renderAnalysis(raw) {
  const data = raw.analysis || raw.data || raw;
  const skills = data.skills ?? data.extracted_skills;
  const strengths = data.strengths;
  const gaps = data.skill_gaps ?? data.skillGaps ?? data.gaps;
  const recommendations = data.recommendations ?? data.actions;
  renderSkills(skills);
  renderList("strengths", strengths, "No strengths returned yet.");
  renderList("gaps", gaps, "No skill gaps returned yet.");
  renderList("recommendations", recommendations, "No recommendations returned yet.");

  const score = getScore({ ...data, skills, strengths, skill_gaps: gaps, recommendations });
  $("score").textContent = score;
  $("ring").style.setProperty("--score-deg", `${score * 3.6}deg`);
  $("skill-count").textContent = arr(skills).length;
  $("gap-count").textContent = arr(gaps).length;
  $("action-count").textContent = arr(recommendations).length;
  $("score-text").textContent = score >= 80
    ? "Excellent foundation. Focus on polishing your strongest areas and closing the remaining gaps."
    : score >= 65
      ? "Good progress. A focused learning plan can make you interview-ready."
      : score >= 50
        ? "Solid starting point. Prioritize the highest-impact gaps first."
        : "There is room to grow. Start with the top skill gaps and build consistently.";
  resultStatus.textContent = "Analysis complete";
  $("insights").classList.add("revealed");
}

function setLoading(loading) {
  analyze.disabled = loading;
  analyze.classList.toggle("loading", loading);
  $("analyze-label").textContent = loading ? "Analyzing profile…" : "Analyze Candidate";
  $("analyze-arrow").textContent = loading ? "•••" : "→";
  resultStatus.textContent = loading ? "Analyzing profile…" : resultStatus.textContent;
}

analyze.addEventListener("click", async () => {
  showError("");
  const file = resume.files[0];
  const username = github.value.trim().replace(/^@+/, "");
  const fileProblem = validateFile(file);
  if (fileProblem) return showError(fileProblem);
  if (!username) return showError("Please enter your GitHub username.");
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) return showError("Enter a valid GitHub username.");

  const form = new FormData();
  form.append("resume", file);
  form.append("github_username", username);
  setLoading(true);

  try {
    const response = await fetch(API_URL, { method: "POST", body: form });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      const message = payload.detail || payload.message || `Analysis server returned ${response.status}.`;
      throw new Error(message);
    }
    renderAnalysis(payload);
    $("insights").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    resultStatus.textContent = "Analysis failed";
    showError(err.message === "Failed to fetch"
      ? "Could not reach the analysis server. Start the backend and try again."
      : err.message || "Something went wrong while analyzing your profile.");
  } finally {
    setLoading(false);
  }
});

github.addEventListener("keydown", (e) => {
  if (e.key === "Enter") analyze.click();
});

github.addEventListener("input", () => {
  github.value = github.value.replace(/\s/g, "");
});

const questions = [
  "Tell me about a project you are most proud of and the impact it created.",
  "What technical skill are you currently improving, and why?",
  "Describe a difficult technical problem you solved and how you approached it.",
  "How do you learn a new technology when you have never used it before?",
  "Tell me about a time you worked with a team to deliver a technical project."
];

$("new-question").onclick = () => {
  const question = questions[Math.floor(Math.random() * questions.length)];
  $("question").textContent = question;
  $("answer").value = "";
  $("feedback-text").textContent = "";
  $("feedback").disabled = false;
  $("answer").focus();
};

$("feedback").onclick = () => {
  const answer = $("answer").value.trim();
  const words = answer ? answer.split(/\s+/).length : 0;
  if (!words) {
    $("feedback-text").textContent = "Write an answer first, then request feedback.";
    return;
  }
  $("feedback-text").textContent = words < 25
    ? "Add more detail: explain the situation, what you personally did, and the result."
    : words < 60
      ? "Good start. Add measurable impact and one specific technical decision."
      : "Strong answer. Keep it structured: situation → action → result → learning.";
};

// Highlight the current section in the sidebar while scrolling.
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".sidebar nav a")];
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
}, { rootMargin: "-25% 0px -60% 0px", threshold: [0, .2, .5] });
sections.forEach(section => observer.observe(section));
