const form = document.getElementById("analyzeForm");

const loading = document.getElementById("loading");
const results = document.getElementById("results");

const skillsList = document.getElementById("skills");
const strengthsList = document.getElementById("strengths");
const skillGapsList = document.getElementById("skill-gaps");
const recommendationsList = document.getElementById("recommendations");


form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const resume = document.getElementById("resume").files[0];
    const githubUsername =
        document.getElementById("github_username").value;


    if (!resume) {
        alert("Please upload your resume.");
        return;
    }


    const formData = new FormData();

    formData.append("resume", resume);
    formData.append("github_username", githubUsername);


    loading.classList.remove("hidden");
    results.classList.add("hidden");


    try {

        const response = await fetch(
            "http://127.0.0.1:8000/analyze",
            {
                method: "POST",
                body: formData
            }
        );


        if (!response.ok) {
            throw new Error("Analysis request failed.");
        }


        const data = await response.json();


        console.log("API Response:", data);


        const analysis = data.analysis;


        displayList(skillsList, analysis.skills);
        displayList(strengthsList, analysis.strengths);
        displayList(skillGapsList, analysis.skill_gaps);
        displayList(
            recommendationsList,
            analysis.recommendations
        );


        results.classList.remove("hidden");


    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong while analyzing the candidate."
        );

    } finally {

        loading.classList.add("hidden");

    }

});


function displayList(element, items) {

    element.innerHTML = "";


    if (!items || items.length === 0) {

        const li = document.createElement("li");

        li.textContent = "None detected.";

        element.appendChild(li);

        return;
    }


    items.forEach(function (item) {

        const li = document.createElement("li");

        li.textContent = item;

        element.appendChild(li);

    });

}