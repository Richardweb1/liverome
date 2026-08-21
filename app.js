(function () {
  "use strict";

  const FULL_ADDRESS = "0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasAnime = typeof anime !== "undefined";
  const toast = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    clearTimeout(toastTimer);

    if (hasAnime && !reduceMotion) {
      anime.remove(toast);
      anime({
        targets: toast,
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 180,
        easing: "easeOutQuad",
      });
    } else {
      toast.style.opacity = "1";
      toast.style.transform = "translate(-50%, 0)";
    }

    toastTimer = setTimeout(() => {
      if (hasAnime && !reduceMotion) {
        anime({
          targets: toast,
          opacity: [1, 0],
          translateY: [0, 18],
          duration: 160,
          easing: "easeInQuad",
        });
      } else {
        toast.style.opacity = "0";
      }
    }, 2400);
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(FULL_ADDRESS);
      showToast("Bradbury contract address copied");
    } catch (error) {
      showToast(FULL_ADDRESS);
    }
  }

  function bindCopyButtons() {
    const buttons = [
      document.getElementById("addressChip"),
      document.getElementById("copyAddressBtn"),
    ].filter(Boolean);

    buttons.forEach((button) => {
      button.addEventListener("click", copyAddress);
    });
  }

  function animatePage() {
    const fill = document.getElementById("confidenceFill");

    if (!hasAnime || reduceMotion) {
      if (fill) fill.style.width = "75%";
      return;
    }

    anime.set(".hero__content > *, .panel", { opacity: 0, translateY: 12 });
    anime.set(fill, { width: "0%" });

    anime.timeline({ easing: "easeOutQuad" })
      .add({
        targets: ".hero__content > *",
        opacity: [0, 1],
        translateY: [12, 0],
        delay: anime.stagger(45),
        duration: 420,
      })
      .add({
        targets: ".panel",
        opacity: [0, 1],
        translateY: [12, 0],
        delay: anime.stagger(35),
        duration: 360,
      }, "-=260")
      .add({
        targets: fill,
        width: ["0%", "75%"],
        duration: 720,
        easing: "easeOutCubic",
      }, "-=240");
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindCopyButtons();
    animatePage();
  });
})();
