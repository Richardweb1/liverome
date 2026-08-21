(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasAnime = typeof anime !== "undefined";

  /* ============================================================
     STATE — mirrors the actual on-chain oracle result
     ============================================================ */
  const oracle = {
    regime: "bull",
    strategy: "aggressive",
    confidence: 75,
  };

  let vaultBalance = 0;

  /* ============================================================
     TOAST
     ============================================================ */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    toastEl.textContent = message;
    clearTimeout(toastTimer);

    if (hasAnime && !reduceMotion) {
      anime.remove(toastEl);
      anime({
        targets: toastEl,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 260,
        easing: "easeOutQuad",
      });
    } else {
      toastEl.style.opacity = "1";
      toastEl.style.transform = "translate(-50%, 0)";
    }

    toastTimer = setTimeout(() => {
      if (hasAnime && !reduceMotion) {
        anime({
          targets: toastEl,
          opacity: [1, 0],
          translateY: [0, 20],
          duration: 220,
          easing: "easeInQuad",
        });
      } else {
        toastEl.style.opacity = "0";
      }
    }, 2400);
  }

  /* ============================================================
     COPY CONTRACT ADDRESS
     ============================================================ */
  const FULL_ADDRESS = "0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd";
  const addressChip = document.getElementById("addressChip");

  addressChip.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(FULL_ADDRESS);
      showToast("Contract address copied");
    } catch (err) {
      showToast(FULL_ADDRESS);
    }
  });

  /* ============================================================
     PAGE LOAD SEQUENCE
     ============================================================ */
  function runLoadSequence() {
    const panels = document.querySelectorAll(".panel");

    if (!hasAnime || reduceMotion) {
      document.getElementById("confidenceFill").style.width = oracle.confidence + "%";
      return;
    }

    anime.set(panels, { opacity: 0, translateY: 14 });
    anime.set(".oracle-readout__headline", { opacity: 0, translateY: 10 });

    anime
      .timeline({ easing: "easeOutQuad" })
      .add({
        targets: panels[0],
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 500,
      })
      .add(
        {
          targets: ".oracle-readout__headline",
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 450,
        },
        "-=250"
      )
      .add(
        {
          targets: "#confidenceFill",
          width: ["0%", oracle.confidence + "%"],
          duration: 900,
          easing: "easeOutCubic",
        },
        "-=200"
      )
      .add(
        {
          targets: panels[1],
          opacity: [0, 1],
          translateY: [14, 0],
          duration: 450,
        },
        "-=650"
      )
      .add(
        {
          targets: panels[2],
          opacity: [0, 1],
          translateY: [14, 0],
          duration: 450,
        },
        "-=350"
      )
      .add(
        {
          targets: panels[3],
          opacity: [0, 1],
          translateY: [14, 0],
          duration: 450,
        },
        "-=300"
      );
  }

  /* ============================================================
     SIGNAL STRIP — draw-on animation representing the classifier
     ============================================================ */
  function animateSignal() {
    const path = document.getElementById("signalPath");
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    if (!hasAnime || reduceMotion) {
      path.style.strokeDashoffset = "0";
      return;
    }

    anime({
      targets: path,
      strokeDashoffset: [length, 0],
      duration: 1400,
      easing: "easeInOutSine",
      delay: 250,
    });
  }

  /* ============================================================
     LIVE DOT — ambient pulse
     ============================================================ */
  function pulseLiveDot() {
    if (!hasAnime || reduceMotion) return;

    anime({
      targets: "#liveDot",
      scale: [1, 1.6],
      opacity: [1, 0.35],
      duration: 1400,
      easing: "easeInOutSine",
      direction: "alternate",
      loop: true,
    });
  }

  /* ============================================================
     DEMO VAULT CONTROLS
     ============================================================ */
  const balanceNumber = document.getElementById("balanceNumber");
  const depositInput = document.getElementById("depositInput");
  const withdrawInput = document.getElementById("withdrawInput");
  const depositBtn = document.getElementById("depositBtn");
  const withdrawBtn = document.getElementById("withdrawBtn");

  function renderBalance(from, to) {
    if (hasAnime && !reduceMotion) {
      anime({
        targets: { value: from },
        value: to,
        duration: 500,
        easing: "easeOutCubic",
        round: 100,
        update: function (anim) {
          balanceNumber.textContent = anim.animations[0].currentValue;
        },
      });
    } else {
      balanceNumber.textContent = to.toFixed(2);
    }
  }

  function bumpPanel(el) {
    if (!hasAnime || reduceMotion) return;
    anime({
      targets: el,
      borderColor: [el === depositBtn ? "#34d399" : "#fb7185", "var(--border)"],
      duration: 500,
      easing: "easeOutQuad",
    });
  }

  depositBtn.addEventListener("click", () => {
    const amount = parseFloat(depositInput.value);
    if (!amount || amount <= 0) {
      showToast("Enter an amount to deposit");
      return;
    }
    const from = vaultBalance;
    vaultBalance += amount;
    renderBalance(from, vaultBalance);
    depositInput.value = "";
    showToast("Recorded locally — deposit(" + amount + ") not yet signed on-chain");
  });

  withdrawBtn.addEventListener("click", () => {
    const amount = parseFloat(withdrawInput.value);
    if (!amount || amount <= 0) {
      showToast("Enter an amount to withdraw");
      return;
    }
    if (amount > vaultBalance) {
      showToast("Insufficient balance");
      return;
    }
    const from = vaultBalance;
    vaultBalance -= amount;
    renderBalance(from, vaultBalance);
    withdrawInput.value = "";
    showToast("Recorded locally — withdraw(" + amount + ") not yet signed on-chain");
  });

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    runLoadSequence();
    animateSignal();
    pulseLiveDot();
  });
})();
