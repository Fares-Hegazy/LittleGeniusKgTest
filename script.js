import { questionsBank } from './questions.js';

let studentName = "";
let selectedHomework = "";
let score = 0;
let totalPoints = 0;
let selectedAnswers = [];
let selectedTags = [];
let submitted = false;

window.addEventListener("DOMContentLoaded", () => {
  const savedName = localStorage.getItem("studentName");
  if (savedName) {
    studentName = savedName;
    document.getElementById("name-section").classList.add("hidden");
    document.getElementById("homework-selection").classList.remove("hidden");
    document.getElementById("welcome-message").textContent = `Welcome, ${studentName}`;
  }
});

document.getElementById("start-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const nameInput = document.getElementById("studentName");
  if (nameInput.value.trim() === "") return;
  studentName = nameInput.value.trim();
  localStorage.setItem("studentName", studentName);
  document.getElementById("start-form").classList.add("hidden");
  document.getElementById("homework-selection").classList.remove("hidden");
  document.getElementById("welcome-message").textContent = `Welcome, ${studentName}`;
});

document.getElementById("start-hw-btn").addEventListener("click", () => {
  const hwSelect = document.getElementById("homeworkSelect");
  const hwName = hwSelect.value;
  if (!hwName || !questionsBank[hwName]) return;

  selectedHomework = hwName;
  const saved = JSON.parse(localStorage.getItem(`${studentName}_${selectedHomework}`));
  if (saved && saved.answers) {
    displaySavedAnswers(saved);
  } else {
    document.getElementById("homework-selection").classList.add("hidden");
    document.getElementById("quiz-section").classList.remove("hidden");
    document.getElementById("hw-title").textContent = `Homework: ${selectedHomework}`;
    showQuestions();
  }
});

function showQuestions() {
  const container = document.getElementById("questions-container");
  container.innerHTML = "";
  score = 0;
  selectedAnswers = [];
  selectedTags = [];
  const hasTags = questionsBank[selectedHomework].some(q => q.type === "Finite or Infinite" || q.type === "END Number");
  totalPoints = hasTags ? questionsBank[selectedHomework].length * 2 : questionsBank[selectedHomework].length;
  submitted = false;

  questionsBank[selectedHomework].forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");

    const questionText = document.createElement("p");
    questionText.innerHTML = `<strong>${index + 1}.</strong><br>${q.question}`;
    questionDiv.appendChild(questionText);

    q.options.forEach(option => {
      const button = document.createElement("button");
      button.classList.add("option-btn");
      button.textContent = option;
      button.addEventListener("click", () =>
        handleAnswer(button, option, q, questionDiv, index)
      );
      questionDiv.appendChild(button);
    });

    container.appendChild(questionDiv);
  });
}

function handleAnswer(button, selected, question, container, index) {
  const buttons = container.querySelectorAll("button.option-btn");
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === question.answer) btn.classList.add("correct");
    else if (btn.textContent === selected) btn.classList.add("incorrect");
  });

  selectedAnswers[index] = selected;
  const isCorrect = selected === question.answer;
  if (isCorrect) score++;

  if (question.type === "Finite or Infinite") {
    const tagDiv = document.createElement("div");
    tagDiv.classList.add("tag-options");
    tagDiv.innerHTML = `<p>Is ${question.answer} Finite or Infinite?</p>`;

    ["Finite", "Infinite"].forEach(tag => {
      const tagBtn = document.createElement("button");
      tagBtn.textContent = tag;
      tagBtn.classList.add("tag-btn");

      if (!isCorrect) {
        tagBtn.disabled = true;
        if (tag === question.tag) tagBtn.classList.add("correct");
      }

      tagBtn.addEventListener("click", () => {
        if (tagBtn.disabled || selectedTags[index]) return;
        tagDiv.querySelectorAll("button.tag-btn").forEach(b => b.disabled = true);

        if (tag === question.tag) {
          tagBtn.classList.add("correct");
          score++;
        } else {
          tagBtn.classList.add("incorrect");
          tagDiv.querySelectorAll("button.tag-btn").forEach(b => {
            if (b.textContent === question.tag) b.classList.add("correct");
          });
        }

        selectedTags[index] = tag;
        saveProgress();
        checkIfDone();
      });

      tagDiv.appendChild(tagBtn);
    });

    container.appendChild(tagDiv);

    if (!isCorrect) {
      selectedTags[index] = question.tag;
      saveProgress();
      checkIfDone();
    }
  } else if (question.type === "END Number" && isCorrect) {
    const endDiv = document.createElement("div");
    endDiv.classList.add("end-question");
    endDiv.innerHTML = `<p>What is the END?</p>`;

    const endInput = document.createElement("input");
    endInput.type = "text";
    endInput.maxLength = 1;
    endInput.id = `endInput-${index}`;
    endInput.style.width = "40px";
    endDiv.appendChild(endInput);

    const endBtn = document.createElement("button");
    endBtn.id = `endBtn-${index}`;
    endBtn.textContent = "Enter";
    endBtn.addEventListener("click", () => {
      console.log(`Enter button clicked for question ${index + 1}`);
      const userInput = endInput.value.trim();
      if (userInput === "") return;
      const isCorrectEnd = userInput === question.end;
      endBtn.disabled = true;
      endInput.disabled = true;

      if (isCorrectEnd) {
        endBtn.classList.add("correct");
        score++;
      } else {
        endBtn.classList.add("incorrect");

        const answerText = document.createElement("p");
        answerText.textContent = `Answer: ${question.end}`;
        answerText.style.marginTop = "6px";
        endDiv.appendChild(answerText);
      }

      selectedTags[index] = userInput;
      saveProgress();
      checkIfDone();
    });

    endDiv.appendChild(endBtn);
    container.appendChild(endDiv);
  } else if (question.type === "END Number" && !isCorrect) {
    const endDiv = document.createElement("div");
    endDiv.classList.add("end-question");
    endDiv.innerHTML = `<p>What is the END?</p>`;
    
    const answerText = document.createElement("p");
    answerText.textContent = `Answer: ${question.end}`;
    answerText.style.marginTop = "6px";
    endDiv.appendChild(endDiv);

    container.appendChild(endDiv);

    selectedTags[index] = question.end;
    saveProgress();
    checkIfDone();
  } else {
    saveProgress();
    checkIfDone();
  }
}

function saveProgress() {
  localStorage.setItem(`${studentName}_${selectedHomework}`, JSON.stringify({
    name: studentName,
    homework: selectedHomework,
    score: score,
    answers: selectedAnswers,
    tags: selectedTags,
    submitted: submitted,
    date: new Date().toLocaleString()
  }));
}

function checkIfDone() {
  const total = questionsBank[selectedHomework].length;
  const allAnswered = selectedAnswers.filter(Boolean).length === total;
  const hasTags = questionsBank[selectedHomework].some(q => q.type === "Finite or Infinite" || q.type === "END Number");
  
  if (allAnswered && (!hasTags || selectedTags.filter(val => val !== undefined).length === total)) {
    showScore();
  }
}

function showScore() {
  const scoreDisplay = document.getElementById("score-display");
  scoreDisplay.textContent = `${studentName}, your score is ${score} out of ${totalPoints}`;
  document.getElementById("score-section").classList.remove("hidden");

  if (!submitted) {
    submitted = true;
    saveProgress();

    const formUrl = new URL("https://docs.google.com/forms/d/e/1FAIpQLSd9Beo32bIPaOz6HCOKic1jPFLIh-WfvZlyMp1uJkxDY5pvtw/formResponse");
    formUrl.searchParams.append("entry.1659354786", studentName);
    formUrl.searchParams.append("entry.2025244723", selectedHomework);
    formUrl.searchParams.append("entry.64546147", `${score}/${totalPoints}`);
    formUrl.searchParams.append("entry.738208110", new Date().toLocaleString());

    fetch(formUrl.toString(), { method: "POST", mode: "no-cors" })
      .then(() => alert("✅ Your result was submitted!"))
      .catch(() => alert("❌ Submission error."));
  } else {
    saveProgress();
  }
}

function displaySavedAnswers(saved) {
  document.getElementById("homework-selection").classList.add("hidden");
  document.getElementById("quiz-section").classList.remove("hidden");
  document.getElementById("hw-title").textContent = `Homework: ${saved.homework}`;

  const container = document.getElementById("questions-container");
  container.innerHTML = "";
  selectedAnswers.length = 0;
  selectedTags.length = [];
  score = saved.score || 0;
  const hasTags = questionsBank[selectedHomework].some(q => q.type === "Finite or Infinite" || q.type === "END Number");
  totalPoints = hasTags ? questionsBank[selectedHomework].length * 2 : questionsBank[selectedHomework].length;
  submitted = saved.submitted || false;
  console.log(`Loaded saved score: ${score}/${totalPoints}`);

  questionsBank[selectedHomework].forEach((q, index) => {
    try {
      const ans = saved.answers[index];
      const tag = saved.tags[index];
      console.log(`Question ${index + 1}: ans=${ans}, tag=${tag}, type=${q.type || 'None'}`);
      const questionDiv = document.createElement("div");
      questionDiv.classList.add("question");

      const questionText = document.createElement("p");
      questionText.innerHTML = `<strong>${index + 1}.</strong><br>${q.question}`;
      questionDiv.appendChild(questionText);

      q.options.forEach(option => {
        const button = document.createElement("button");
        button.classList.add("option-btn");
        button.textContent = option;

        if (ans) {
          button.disabled = true;
          if (option === q.answer) button.classList.add("correct");
          if (option === ans && option !== q.answer) button.classList.add("incorrect");
        } else {
          button.addEventListener("click", () =>
            handleAnswer(button, option, q, questionDiv, index)
          );
        }

        questionDiv.appendChild(button);
      });

      if (q.type === "Finite or Infinite" && ans) {
        const tagDiv = document.createElement("div");
        tagDiv.classList.add("tag-options");
        tagDiv.innerHTML = `<p>Is ${q.answer} Finite or Infinite?</p>`;

        if (ans && tag) {
          ["Finite", "Infinite"].forEach(tagOption => {
            const tagBtn = document.createElement("button");
            tagBtn.classList.add("tag-btn");
            tagBtn.textContent = tagOption;
            tagBtn.disabled = true;

            if (tagOption === q.tag) tagBtn.classList.add("correct");
            if (tagOption === tag && tagOption !== q.tag) tagBtn.classList.add("incorrect");

            tagDiv.appendChild(tagBtn);
          });
        } else if (ans && !tag) {
          const isCorrect = ans === q.answer;
          ["Finite", "Infinite"].forEach(tagOption => {
            const tagBtn = document.createElement("button");
            tagBtn.classList.add("tag-btn");
            tagBtn.textContent = tagOption;

            if (!isCorrect) {
              tagBtn.disabled = true;
              if (tagOption === q.tag) tagBtn.classList.add("correct");
            }

            tagBtn.addEventListener("click", () => {
              if (tagBtn.disabled || selectedTags[index]) return;
              tagDiv.querySelectorAll("button.tag-btn").forEach(b => b.disabled = true);

              if (tagOption === q.tag) {
                tagBtn.classList.add("correct");
                score++;
              } else {
                tagBtn.classList.add("incorrect");
                tagDiv.querySelectorAll("button.tag-btn").forEach(b => {
                  if (b.textContent === q.tag) b.classList.add("correct");
                });
              }

              selectedTags[index] = tagOption;
              saveProgress();
              checkIfDone();
            });

            tagDiv.appendChild(tagBtn);
          });

          if (!isCorrect) {
            selectedTags[index] = q.tag;
            saveProgress();
            checkIfDone();
          }
        }

        questionDiv.appendChild(tagDiv);
      } else if (q.type === "END Number" && ans) {
        const endDiv = document.createElement("div");
        endDiv.classList.add("end-question");
        endDiv.innerHTML = `<p>What is the END?</p>`;

        if (ans === q.answer && tag) {
          const endInput = document.createElement("input");
          endInput.type = "text";
          endInput.maxLength = 1;
          endInput.id = `endInput-${index}`;
          endInput.style.width = "40px";
          endInput.value = tag;
          endInput.disabled = true;

          const endBtn = document.createElement("button");
          endBtn.id = `endBtn-${index}`;
          endBtn.textContent = "Enter";
          endBtn.disabled = true;
          if (tag === q.end) endBtn.classList.add("correct");
          else endBtn.classList.add("incorrect");

          endDiv.appendChild(endInput);
          endDiv.appendChild(endBtn);

          if (tag !== q.end) {
            const answerText = document.createElement("p");
            answerText.textContent = `Answer: ${q.end}`;
            answerText.style.marginTop = "6px";
            endDiv.appendChild(answerText);
          }

          questionDiv.appendChild(endDiv);
        } else if (ans === q.answer && !tag) {
          const endInput = document.createElement("input");
          endInput.type = "text";
          endInput.maxLength = 1;
          endInput.id = `endInput-${index}`;
          endInput.style.width = "40px";
          endDiv.appendChild(endInput);

          const endBtn = document.createElement("button");
          endBtn.id = `endBtn-${index}`;
          endBtn.textContent = "Enter";
          endBtn.addEventListener("click", () => {
            console.log(`Enter button clicked for question ${index + 1}, input: ${endInput.value}`);
            const userInput = endInput.value.trim();
            if (userInput === "") return;
            const isCorrectEnd = userInput === q.end;
            endBtn.disabled = true;
            endInput.disabled = true;

            if (isCorrectEnd) {
              endBtn.classList.add("correct");
              score++;
            } else {
              endBtn.classList.add("incorrect");

              const answerText = document.createElement("p");
              answerText.textContent = `Answer: ${q.end}`;
              answerText.style.marginTop = "6px";
              endDiv.appendChild(answerText);
            }

            selectedTags[index] = userInput;
            saveProgress();
            checkIfDone();
          });

          endDiv.appendChild(endBtn);
          questionDiv.appendChild(endDiv);
        } else {
          const answerText = document.createElement("p");
          answerText.textContent = `Answer: ${q.end}`;
          answerText.style.marginTop = "6px";
          endDiv.appendChild(answerText);
          questionDiv.appendChild(endDiv);
          selectedTags[index] = q.end;
        }
      }

      container.appendChild(questionDiv);

      selectedAnswers[index] = ans || null;
      selectedTags[index] = tag || undefined;
    } catch (error) {
      console.error(`Error rendering question ${index + 1}:`, error);
      const questionDiv = document.createElement("div");
      questionDiv.classList.add("question");
      questionDiv.innerHTML = `<p>Error loading question ${index + 1}. Please try again.</p>`;
      container.appendChild(questionDiv);
    }
  });

  saveProgress();
  const allAnswered = selectedAnswers.filter(Boolean).length === questionsBank[selectedHomework].length;
  const hasTags = questionsBank[selectedHomework].some(q => q.type === "Finite or Infinite" || q.type === "END Number");
  if (allAnswered && (!hasTags || selectedTags.filter(val => val !== undefined).length === questionsBank[selectedHomework].length)) {
    showScore();
  }
}
