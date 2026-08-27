const thornFrame = document.querySelector(".thorn-frame");
const thornVideo = document.querySelector(".thorn");
const forms = document.querySelectorAll(".signup");
const bodyCopy = document.querySelector(".tagline");
let thornScale = 1;
let thornTargetScale = 1;
let thornScaleFrame;

function allowManualVideoPlay() {
  thornFrame?.classList.add("needs-manual-play");
}

function playThornVideo() {
  thornVideo?.play().catch(allowManualVideoPlay);
}

function scaleThorn() {
  if (!thornVideo) return;

  const progress = Math.min(1, window.scrollY / window.innerHeight);
  thornTargetScale = 1 - progress * 0.1;

  if (!thornScaleFrame) {
    thornScaleFrame = requestAnimationFrame(renderThornScale);
  }
}

function renderThornScale() {
  thornScale += (thornTargetScale - thornScale) * 0.12;
  document.documentElement.style.setProperty("--thorn-scale", thornScale);

  if (Math.abs(thornTargetScale - thornScale) < 0.0001) {
    thornScale = thornTargetScale;
    document.documentElement.style.setProperty("--thorn-scale", thornScale);
    thornScaleFrame = undefined;
    return;
  }

  thornScaleFrame = requestAnimationFrame(renderThornScale);
}

if (thornVideo && thornFrame) {
  playThornVideo();

  setTimeout(() => {
    if (thornVideo.paused) allowManualVideoPlay();
  }, 600);

  thornVideo.addEventListener("play", () => {
    thornFrame.classList.remove("needs-manual-play");
  });

  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        playThornVideo();
      } else {
        thornVideo.pause();
      }
    });

    videoObserver.observe(thornVideo);
  }

  scaleThorn();
  window.addEventListener("scroll", scaleThorn, { passive: true });
}

function showSignupSuccess(form) {
  const section = form.closest(".hero, .bottom-signup");
  section.classList.add("is-submitted");
  section.classList.add("is-inverted");

  setTimeout(() => {
    section.classList.remove("is-inverted");
  }, 3000);

  if (section.classList.contains("hero")) {
    setTimeout(() => {
      section.querySelector("h1").textContent = "Thank you";
      if (bodyCopy) bodyCopy.textContent = "We will be in touch.";
    }, 320);
  } else {
    section.querySelector("h2").textContent = "We will be in touch.";
  }
}

function typeNote(form, message) {
  const section = form.closest(".hero, .bottom-signup");
  const note = section.querySelector(".launch-note");
  if (!note) return;
  clearInterval(note.typeTimer);
  note.textContent = "";

  let index = 0;
  note.typeTimer = setInterval(() => {
    note.textContent = message.slice(0, index + 1);
    index += 1;

    if (index >= message.length) clearInterval(note.typeTimer);
  }, 26);
}

async function handleSignup(form) {
  const button = form.querySelector("button");
  const input = form.querySelector("input");
  const originalText = button.textContent;

  if (button.disabled) return;

  if (!input.validity.valid) {
    typeNote(form, "Enter a valid email.");
    input.focus();
    return;
  }

  button.disabled = true;
  button.textContent = "Sending";

  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: input.value }),
    });

    if (!response.ok) throw new Error("Could not subscribe. Try again.");

    showSignupSuccess(form);
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText;
    typeNote(form, error.message);
    input.focus();
  }
}

forms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSignup(form);
  });

  form.querySelector("button").addEventListener("click", (event) => {
    event.preventDefault();
    handleSignup(form);
  });
});
