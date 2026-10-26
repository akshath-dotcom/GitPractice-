
/* =========================================================
   AKSHATH.EXE — IMMERSIVE CYBERPUNK PORTFOLIO
   Requires the existing index.html and appended CSS.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = matchMedia("(max-width: 600px)").matches;

  // Preserve the original portfolio's navigation and footer.
  const menuToggle = $("#menu-toggle");
  const navLinks = $("#nav-links");
  const year = $("#year");
  const recruiterModeButton = $("#recruiter-mode-button");

  if (year) year.textContent = new Date().getFullYear();

  if (menuToggle && navLinks) {
    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    $$("a", navLinks).forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        menuToggle.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Add the desktop-launch button to the original portfolio.
  const launchButton = document.createElement("button");
  launchButton.type = "button";
  launchButton.className = "exe-world-button";
  launchButton.textContent = "▣ OPEN AKSHATH.EXE";
  launchButton.setAttribute("aria-label", "Open interactive portfolio desktop");
  document.body.appendChild(launchButton);

  // Build the experience without replacing the user's real portfolio.
  const world = document.createElement("div");
  world.id = "exe-world";
  world.setAttribute("role", "application");
  world.setAttribute("aria-label", "AKSHATH.EXE interactive portfolio");
  world.innerHTML = `
    <div class="exe-grid"></div>
    <div class="exe-scanlines"></div>

    <section class="exe-boot" id="exe-boot" aria-live="polite">
      <div>AKSHATH.EXE / SYSTEM INITIALIZATION</div>
      <p id="exe-boot-status">Loading developer environment...</p>
      <div class="exe-boot-bar"><span></span></div>
    </section>

    <main class="exe-desktop" id="exe-desktop">
      <header class="exe-topbar">
        <span class="exe-brand">AKSHATH.EXE</span>
        <span class="exe-status">● SYSTEM ONLINE</span>
      </header>

      <section class="exe-welcome" id="exe-welcome">
        <div class="exe-eyebrow">PERSONAL DEVELOPER ENVIRONMENT</div>
        <h1>WELCOME TO<br><span>MY WORLD_</span></h1>
        <p>
          Explore my skills, projects and developer journey.
          Choose an app or open the command console.
        </p>
        <div class="exe-actions">
          <button class="exe-btn exe-btn-primary" data-open="recruiter">
            ▣ Recruiter mode
          </button>
          <button class="exe-btn exe-btn-primary" data-open="missions">
            ▶ Start exploring
          </button>
          <button class="exe-btn" data-open="terminal">
            &gt;_ Open terminal
          </button>
          <button class="exe-btn" data-action="exit">
            View classic portfolio ↗
          </button>
        </div>
      </section>

      <nav class="exe-desktop-icons" aria-label="Desktop applications">
        <button class="exe-icon" data-open="recruiter">
          <span class="exe-icon-symbol">▣</span><span>Recruiter.exe</span>
        </button>
        <button class="exe-icon" data-open="about">
          <span class="exe-icon-symbol">◈</span><span>About.exe</span>
        </button>
        <button class="exe-icon" data-open="missions">
          <span class="exe-icon-symbol">▣</span><span>Missions.exe</span>
        </button>
        <button class="exe-icon" data-open="skills">
          <span class="exe-icon-symbol">⌘</span><span>Skills.exe</span>
        </button>
        <button class="exe-icon" data-open="terminal">
          <span class="exe-icon-symbol">&gt;_</span><span>Terminal.exe</span>
        </button>
        <button class="exe-icon" data-open="achievements">
          <span class="exe-icon-symbol">✧</span><span>Achievements.exe</span>
        </button>
        <button class="exe-icon" data-open="contact">
          <span class="exe-icon-symbol">✉</span><span>Contact.exe</span>
        </button>
      </nav>
    </main>

    <footer class="exe-taskbar" id="exe-taskbar">
      <button type="button" data-action="home" aria-label="Desktop home">▦ AK</button>
      <span id="exe-taskbar-apps"></span>
      <button type="button" data-action="exit">↗ Site</button>
      <span class="exe-clock" id="exe-clock">--:--</span>
    </footer>

    <div id="exe-notice" class="exe-notice" hidden role="status"></div>
  `;

  document.body.appendChild(world);
  // Secret protocol visual effects
  const secretStyle = document.createElement("style");
  secretStyle.textContent = `
    @keyframes exe-system-override {
      0%   { opacity: 0; transform: scale(0.99); filter: hue-rotate(90deg); }
      15%  { opacity: 1; transform: translateX(-4px); }
      30%  { transform: translateX(4px); }
      45%  { transform: translateX(-2px); }
      65%  { transform: translateX(2px); }
      100% { opacity: 1; transform: translateX(0); filter: none; }
    }

    #exe-world.exe-secret-activated::after {
      content: "SYSTEM OVERRIDE // SECRET PROTOCOL ACCEPTED";
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      padding: 20px;
      box-sizing: border-box;
      background: rgba(0, 0, 0, .88);
      color: #a3ff68;
      font: bold clamp(14px, 3vw, 24px) monospace;
      text-align: center;
      text-shadow: 0 0 18px #a3ff68;
      animation: exe-system-override 1.3s steps(1, end) forwards;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      #exe-world.exe-secret-activated::after {
        animation: none;
      }
    }
  `;
  document.head.appendChild(secretStyle);
  world.hidden = true;

  const desktop = $("#exe-desktop", world);
  const welcome = $("#exe-welcome", world);
  const taskbarApps = $("#exe-taskbar-apps", world);
  const notice = $("#exe-notice", world);
  const boot = $("#exe-boot", world);
  const bootStatus = $("#exe-boot-status", world);
  const clock = $("#exe-clock", world);

  let zIndex = 20;
  let activeWindow = null;
  let noticeTimer;
  let bootTimer;
  let bootApp = null;
  let windowCounter = 0;
  let matrixCanvas = null;
  let matrixFrame = 0;
  let matrixResizeHandler = null;
  let terminalHistory = [];
  let historyIndex = 0;
  let konamiIndex = 0;

  const windows = new Map();
  const unlocked = new Set();

  // The achievement list intentionally reflects exploration, not skill level.
  const achievementList = [
    { id: "first-boot", title: "First Contact", description: "Enter the developer environment.", icon: "◈" },
    { id: "terminal", title: "Command Runner", description: "Run a terminal command.", icon: ">_" },
    { id: "mission", title: "Mission Accepted", description: "Explore your project missions.", icon: "▣" },
    { id: "all-apps", title: "System Explorer", description: "Open every portfolio app.", icon: "✧" },
    { id: "matrix", title: "Follow the Code", description: "Discover the hidden Matrix effect.", icon: "▤" },
    {
      id: "konami",
      title: "Secret Protocol",
      description: "↑ ↑ ↓ ↓ ← → ← → ... discover the final two keys.",
      icon: "⌁"
    }
  ];

  try {
    const saved = JSON.parse(localStorage.getItem("akshathExeAchievements") || "[]");
    if (Array.isArray(saved)) saved.forEach(id => unlocked.add(id));
  } catch {
    // Storage may be disabled; achievements still work for this session.
  }

  function saveAchievements() {
    try {
      localStorage.setItem("akshathExeAchievements", JSON.stringify([...unlocked]));
    } catch {
      // The experience remains usable without persistent storage.
    }
  }

  function unlock(id, showToast = true) {
    if (unlocked.has(id)) return;
    unlocked.add(id);
    saveAchievements();
    if (showToast) {
      toast(`ACHIEVEMENT UNLOCKED: ${achievementList.find(a => a.id === id)?.title || id}`);
    }
  }

  function toast(message) {
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 3000);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function sourceSection(kind) {
    const selectors = {
      about: ["#about", ".about-section", '[id*="about"]'],
      skills: ["#skills", ".skills-section", '[id*="skill"]'],
      projects: ["#projects", ".projects-section", '[id*="project"]'],
      contact: ["#contact", ".contact-section", '[id*="contact"]']
    };

    for (const selector of selectors[kind] || []) {
      const found = $(selector, document);
      if (found && !world.contains(found)) return found;
    }

    if (kind === "about") return $(".hero", document);
    if (kind === "projects") return $(".project-card", document)?.parentElement;
    if (kind === "skills") return $(".skill-card", document)?.parentElement;

    return null;
  }

  function copySource(kind) {
    const source = sourceSection(kind);
    const wrapper = document.createElement("div");

    if (!source) {
      wrapper.innerHTML = `
        <h2>${escapeHTML(kind)}</h2>
        <p>Open the classic portfolio to view this section.</p>
        <button class="exe-btn" data-action="exit">Open classic portfolio</button>
      `;
      return wrapper;
    }

    // Clone existing content so the original page remains intact.
    const clone = source.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
    clone.querySelectorAll("script, style, iframe, form").forEach(el => el.remove());

    wrapper.appendChild(clone);

    // Original section links remain usable. Placeholder links are not treated
    // as real URLs; replace them in the original HTML before publishing.
    wrapper.querySelectorAll('a[href="#"]').forEach(link => {
      if (link.dataset.placeholder === "true") {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
      }
    });

    return wrapper;
  }

  function makeMissionContent() {
    const container = document.createElement("div");
    const projects = $$(".project-card", document).filter(card => !world.contains(card));

    container.innerHTML = `
      <p class="exe-eyebrow">QUEST LOG / PROJECT ARCHIVE</p>
      <h2>Available missions</h2>
      <p>Explore projects and experiments from my developer journey.</p>
    `;

    if (!projects.length) {
      const fallback = document.createElement("div");
      fallback.appendChild(copySource("projects"));
      container.appendChild(fallback);
      return container;
    }

    projects.forEach((project, index) => {
      const card = document.createElement("article");
      card.className = "exe-mission";

      const heading = $("h2, h3, h4", project);
      const title = heading?.textContent.trim() || `Project ${index + 1}`;
      const paragraph = $("p", project);
      const description = paragraph?.textContent.trim() ||
        "Open the classic portfolio for the full project description.";

      const tags = [...project.querySelectorAll(
        ".tag, .tech-stack span, .project-tech span, li"
      )].map(tag => tag.textContent.trim()).filter(Boolean).slice(0, 8);

      card.innerHTML = `
        <div class="exe-eyebrow">MISSION ${String(index + 1).padStart(2, "0")}</div>
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(description)}</p>
        <div>${tags.map(tag => `<span class="exe-tag">${escapeHTML(tag)}</span>`).join("")}</div>
      `;

      const actions = document.createElement("div");
      actions.className = "exe-actions";
      actions.style.justifyContent = "flex-start";
      actions.style.marginTop = "12px";

      const links = [...project.querySelectorAll("a[href]")].filter(link => {
        const href = link.getAttribute("href");
        return href && href !== "#" && !link.dataset.placeholder;
      });

      links.forEach(link => {
        const safeLink = document.createElement("a");
        safeLink.className = "exe-btn";
        safeLink.textContent = link.textContent.trim() || "Open link";
        safeLink.href = link.href;
        safeLink.target = "_blank";
        safeLink.rel = "noopener noreferrer";
        actions.appendChild(safeLink);
      });

      const details = document.createElement("button");
      details.className = "exe-btn";
      details.type = "button";
      details.textContent = "View original";
      details.addEventListener("click", () => {
        closeWindow("missions");
        exitWorld();
        project.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      });
      actions.appendChild(details);

      card.appendChild(actions);
      container.appendChild(card);
    });

    return container;
  }

  function makeAchievementsContent() {
    const container = document.createElement("div");
    container.innerHTML = `
      <p class="exe-eyebrow">PLAYER PROFILE / EXPLORATION</p>
      <h2>Achievements</h2>
      <p>These badges track exploration of the portfolio, not coding proficiency.</p>
    `;

    const progress = document.createElement("p");
    progress.textContent = `${unlocked.size} / ${achievementList.length} unlocked`;
    container.appendChild(progress);

    achievementList.forEach(achievement => {
      const row = document.createElement("div");
      row.className = "exe-achievement" + (
        unlocked.has(achievement.id) ? " unlocked" : ""
      );

      row.innerHTML = `
        <span class="exe-achievement-symbol">${unlocked.has(achievement.id) ? achievement.icon : "◇"}</span>
        <div>
          <strong>${unlocked.has(achievement.id) ? escapeHTML(achievement.title) : "LOCKED ACHIEVEMENT"}</strong>
          <small>${escapeHTML(achievement.description)}</small>
        </div>
      `;

      container.appendChild(row);
    });

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "exe-btn";
    reset.textContent = "Reset achievements";
    reset.addEventListener("click", () => {
      unlocked.clear();
      saveAchievements();
      toast("Achievement progress reset.");
      closeWindow("achievements");
      openWindow("achievements");
    });

    container.appendChild(reset);
    return container;
  }

  function makeTerminalContent() {
    const container = document.createElement("div");
    container.innerHTML = `
      <p class="exe-eyebrow">LOCAL CONSOLE / SAFE COMMAND SIMULATOR</p>
      <div class="exe-terminal-output" aria-live="polite">
        <div class="exe-terminal-line exe-info">AKSHATH.EXE [Version 1.0]</div>
        <div class="exe-terminal-line">Portfolio command console ready.</div>
        <div class="exe-terminal-line">Type help to list available commands.</div>
      </div>
      <form class="exe-terminal-form">
        <label for="exe-command-input">visitor@akshath:~$</label>
        <input id="exe-command-input" name="command" autocomplete="off"
          autocapitalize="off" spellcheck="false" aria-label="Terminal command">
      </form>
    `;

    const output = $(".exe-terminal-output", container);
    const form = $(".exe-terminal-form", container);
    const input = $("#exe-command-input", container);

    function print(text, type = "") {
      const line = document.createElement("div");
      line.className = "exe-terminal-line" + (type ? ` exe-${type}` : "");
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    const commands = {
      help: () => print(
        "help | whoami | about | skills | projects | recruiter | contact | achievements | date | matrix | clear | exit\n"
        + "HINT: Some protocols are unlocked with a legendary key sequence..."
      ),
      whoami: () => print("Visitor connected to AKSHATH.EXE. Developer profile loaded."),
      about: () => openWindow("about"),
      skills: () => openWindow("skills"),
      projects: () => openWindow("missions"),
      recruiter: () => openWindow("recruiter"),
      contact: () => openWindow("contact"),
      achievements: () => openWindow("achievements"),
      date: () => print(new Date().toString()),
      matrix: () => startMatrix(),
      clear: () => { output.replaceChildren(); },
      exit: () => exitWorld()
    };

    form.addEventListener("submit", event => {
      event.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;

      print(`visitor@akshath:~$ ${raw}`, "info");
      terminalHistory.push(raw);
      historyIndex = terminalHistory.length;

      const command = raw.toLowerCase().split(/\s+/)[0];
      unlock("terminal");

      if (commands[command]) {
        commands[command]();
      } else if (command === "sudo") {
        print("Nice try. This is a portfolio simulator, not a system shell.", "error");
      } else if (command === "hack") {
        print("No real systems are accessed or modified here.", "error");
      } else if (command === "konami") {
        secretProtocol();
      } else {
        print(`Unknown command: ${command}. Type help.`, "error");
      }

      input.value = "";
    });

    input.addEventListener("keydown", event => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = terminalHistory[historyIndex] || "";
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        historyIndex = Math.min(terminalHistory.length, historyIndex + 1);
        input.value = terminalHistory[historyIndex] || "";
      }

      if (event.key === "Tab") {
        event.preventDefault();
        const options = [
          "help", "whoami", "about", "skills", "projects", "recruiter",
          "contact", "achievements", "date", "matrix", "clear", "exit"
        ];
        const match = options.find(option => option.startsWith(input.value.toLowerCase()));
        if (match) input.value = match;
      }
    });

    return container;
  }

  function makeRecruiterContent() {
    const container = document.createElement("div");
    container.className = "exe-recruiter-content";
    container.innerHTML = `
      <p class="exe-eyebrow">RECRUITER MODE / CANDIDATE OVERVIEW</p>
      <h2>Akshath</h2>
      <p class="exe-recruiter-intro">A concise view of my background, skills, projects, and contact details.</p>
      <section class="exe-recruiter-card exe-featured-project">
        <p class="exe-eyebrow">FEATURED PROJECT</p>
        <h3>AgriChain — Supply Chain Transparency</h3>
        <p>
          A project concept focused on improving agricultural supply-chain
          transparency by tracking produce from farm to consumer using QR codes
          and blockchain technology.
        </p>
        <p>
          <strong>Focus:</strong> Blockchain · Smart Contracts · QR Tracking
        </p>
        <div class="exe-actions">
          <a class="exe-btn exe-btn-primary"
             href="#projects"
             data-exit-exe>
            Explore portfolio projects ↗
          </a>
        </div>
      </section>
      <section class="exe-recruiter-card">
        <h3>Let's Connect</h3>
        <p>Interested in my profile? Let's discuss internships and opportunities.</p>
        <div class="exe-actions">
          <a class="exe-btn exe-btn-primary"
             href="mailto:satheeshakshath@gmail.com">
            ✉ Contact me
          </a>
          <a class="exe-btn"
             href="https://github.com/akshath-dotcom"
             target="_blank"
             rel="noopener noreferrer">
            GitHub ↗
          </a>
          <a class="exe-btn"
             href="https://www.linkedin.com/in/akshath-s-955219280?utm_source=share_via&amp;utm_content=profile&amp;utm_medium=member_android"
             target="_blank"
             rel="noopener noreferrer">
            LinkedIn ↗
          </a>
        </div>
      </section>
      <div class="exe-actions exe-recruiter-actions">
        <a class="exe-btn exe-btn-primary" href="resume.pdf" download>
          Download resume
        </a>
        <button class="exe-btn" type="button" data-action="exit">
          View full portfolio
        </button>
      </div>
    `;

    ["about", "skills", "projects", "contact"].forEach(kind => {
      const section = document.createElement("section");
      section.className = "exe-recruiter-section";
      section.appendChild(copySource(kind));
      container.appendChild(section);
    });

    return container;
  }

  const appDefinitions = {
    recruiter: { title: "Recruiter Overview", symbol: "▣", small: false, content: makeRecruiterContent },
    about: { title: "About Me", symbol: "◈", small: false, content: () => copySource("about") },
    missions: { title: "Project Missions", symbol: "▣", small: false, content: makeMissionContent },
    skills: { title: "Skill Database", symbol: "⌘", small: false, content: () => copySource("skills") },
    terminal: { title: "Command Terminal", symbol: ">_", small: true, content: makeTerminalContent },
    achievements: { title: "Achievements", symbol: "✧", small: false, content: makeAchievementsContent },
    contact: { title: "Contact", symbol: "✉", small: true, content: () => copySource("contact") }
  };

  function renderTaskbar() {
    taskbarApps.replaceChildren();

    for (const [id, win] of windows) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${appDefinitions[id].symbol} ${appDefinitions[id].title}`;
      button.classList.toggle("active", activeWindow === win && !win.hidden);
      button.addEventListener("click", () => {
        if (!win.hidden && activeWindow === win) {
          win.hidden = true;
        } else {
          win.hidden = false;
          focusWindow(win);
        }
        renderTaskbar();
      });
      taskbarApps.appendChild(button);
    }
  }

  function focusWindow(win) {
    if (!win || win.hidden) return;
    activeWindow = win;
    win.style.zIndex = String(++zIndex);
    renderTaskbar();
  }

  function closeWindow(id) {
    const win = windows.get(id);
    if (!win) return;
    win.remove();
    windows.delete(id);
    if (activeWindow === win) activeWindow = null;
    renderTaskbar();
  }

  function minimizeWindow(win) {
    win.hidden = true;
    if (activeWindow === win) activeWindow = null;
    renderTaskbar();
  }

  function makeDraggable(win, titlebar) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    titlebar.addEventListener("pointerdown", event => {
      if (event.target.closest("button")) return;
      if (event.pointerType === "touch") return;
      pointerId = event.pointerId;
      titlebar.setPointerCapture(pointerId);

      const rect = win.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      win.style.left = `${rect.left}px`;
      win.style.top = `${rect.top}px`;
      win.style.transform = "none";
      focusWindow(win);
    });

    titlebar.addEventListener("pointermove", event => {
      if (pointerId !== event.pointerId) return;

      const maxLeft = innerWidth - win.offsetWidth;
      const maxTop = innerHeight - 80;
      const left = Math.max(0, Math.min(maxLeft, initialLeft + event.clientX - startX));
      const top = Math.max(0, Math.min(maxTop, initialTop + event.clientY - startY));

      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    });

    const release = event => {
      if (pointerId === event.pointerId) pointerId = null;
    };

    titlebar.addEventListener("pointerup", release);
    titlebar.addEventListener("pointercancel", release);
  }

  function openWindow(id) {
    const definition = appDefinitions[id];
    if (!definition) return;

    welcome.hidden = true;

    if (windows.has(id)) {
      const existing = windows.get(id);
      existing.hidden = false;
      focusWindow(existing);
      return;
    }

    const win = document.createElement("section");
    win.className = "exe-window" + (definition.small ? " exe-window-small" : "");
    win.dataset.app = id;
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", definition.title);
    win.style.zIndex = String(++zIndex);

    // Stagger new windows without placing them off-screen.
    const offset = (windowCounter++ % 5) * 24;
    win.style.left = isMobile ? "8px" : `calc(50% + ${offset}px)`;
    win.style.top = isMobile ? "5%" : `calc(12% + ${offset}px)`;
    win.style.transform = isMobile ? "none" : "translateX(-50%)";

    const titlebar = document.createElement("header");
    titlebar.className = "exe-titlebar";
    titlebar.innerHTML = `
      <span class="exe-window-title">${definition.symbol} ${escapeHTML(definition.title)}</span>
      <div class="exe-window-controls">
        <button type="button" data-window-action="minimize" aria-label="Minimize window">—</button>
        <button type="button" data-window-action="close" class="exe-close" aria-label="Close window">×</button>
      </div>
    `;

    const content = document.createElement("div");
    content.className = "exe-window-content";
    content.appendChild(definition.content());

    win.append(titlebar, content);
    desktop.appendChild(win);
    windows.set(id, win);
    makeDraggable(win, titlebar);

    titlebar.addEventListener("click", event => {
      const action = event.target.closest("[data-window-action]")?.dataset.windowAction;
      if (action === "close") closeWindow(id);
      if (action === "minimize") minimizeWindow(win);
    });

    win.addEventListener("pointerdown", () => focusWindow(win));
    focusWindow(win);

    if (id === "missions") unlock("mission");
    if (windows.size === Object.keys(appDefinitions).length) unlock("all-apps");

    renderTaskbar();

    if (id === "terminal") {
      setTimeout(() => $("#exe-command-input", win)?.focus(), 50);
    }
  }

  function exitWorld() {
    stopMatrix();
    clearTimeout(bootTimer);
    bootApp = null;
    world.hidden = true;
    launchButton.hidden = false;
    document.body.style.overflow = "";
  }

  function finishBoot() {
    boot.hidden = true;
    if (bootApp) {
      const app = bootApp;
      bootApp = null;
      openWindow(app);
      return;
    }
    welcome.hidden = false;
  }

  function enterWorld(appToOpen = null) {
    world.hidden = false;
    launchButton.hidden = true;
    document.body.style.overflow = "hidden";
    unlock("first-boot");
    toast("SYSTEM TIP: Curious explorers may discover hidden protocols...");

    bootApp = appToOpen;
    bootStatus.textContent = "Loading apps / preparing interface...";
    boot.hidden = false;
    welcome.hidden = true;

    clearTimeout(bootTimer);
    bootTimer = setTimeout(finishBoot, reducedMotion ? 0 : 1100);
  }

  launchButton.addEventListener("click", () => enterWorld());
  recruiterModeButton?.addEventListener("click", () => enterWorld("recruiter"));

  world.addEventListener("click", event => {
    const portfolioLink = event.target.closest("[data-exit-exe]");
    if (portfolioLink) {
      event.preventDefault();
      exitWorld();
      sourceSection("projects")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
      });
      return;
    }

    const opener = event.target.closest("[data-open]");
    if (opener) openWindow(opener.dataset.open);

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "exit") exitWorld();

    if (action === "home") {
      for (const win of windows.values()) win.hidden = true;
      activeWindow = null;
      welcome.hidden = false;
      renderTaskbar();
    }
  });

  // Live clock.
  function updateClock() {
    clock.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit", minute: "2-digit"
    }).format(new Date());
  }

  updateClock();
  setInterval(updateClock, 15000);

  // Matrix rain easter egg. It is a visual effect only.
  function startMatrix(showToast = true) {
    if (matrixCanvas) {
      if (!showToast) return;
      stopMatrix();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "exe-matrix";
    canvas.setAttribute("aria-hidden", "true");
    world.appendChild(canvas);
    matrixCanvas = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      matrixCanvas = null;
      return;
    }

    const glyphs = "01AKSHATH<>/{}[]";
    let width = 0;
    let height = 0;
    let columns = 0;
    let drops = [];

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      width = innerWidth;
      height = innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / 16);
      drops = Array.from({ length: columns }, () => Math.random() * -40);
    }

    function draw() {
      if (!matrixCanvas || world.hidden) return;
      ctx.fillStyle = "rgba(5,8,13,0.12)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = "13px monospace";

      for (let i = 0; i < drops.length; i++) {
        const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillStyle = i % 3 === 0 ? "#42dcff" : "#a3ff68";
        ctx.fillText(glyph, i * 16, drops[i] * 16);
        if (drops[i] * 16 > height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.7;
      }

      matrixFrame = requestAnimationFrame(draw);
    }

    matrixResizeHandler = () => resize();
    window.addEventListener("resize", matrixResizeHandler);
    resize();
    canvas.dataset.listening = "true";
    draw();
    unlock("matrix", showToast);

    if (showToast) {
      toast("SECRET EFFECT ACTIVATED — MATRIX MODE");
    }
  }

  function stopMatrix() {
    if (!matrixCanvas) return;
    cancelAnimationFrame(matrixFrame);
    if (matrixResizeHandler) {
      window.removeEventListener("resize", matrixResizeHandler);
      matrixResizeHandler = null;
    }
    matrixCanvas.remove();
    matrixCanvas = null;
  }

  function secretProtocol() {
    if (world.classList.contains("exe-secret-activated")) return;

    world.classList.add("exe-secret-activated");

    unlock("konami");
    toast("SYSTEM OVERRIDE INITIATED");

    startMatrix(false);

    setTimeout(() => {
      world.classList.remove("exe-secret-activated");
      toast("🏆 ACHIEVEMENT UNLOCKED: SECRET PROTOCOL");
    }, 1500);
  }

  // Konami sequence: ↑ ↑ ↓ ↓ ← → ← → B A
  const secretKeys = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"
  ];

  document.addEventListener("keydown", event => {
    if (world.hidden) return;

    if (event.key === "Escape") {
      if (matrixCanvas) stopMatrix();
      else if (activeWindow) minimizeWindow(activeWindow);
      else exitWorld();
      return;
    }

    const target = event.target;
    const typing = target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable;

    if (!typing && event.key === "/") {
      event.preventDefault();
      openWindow("terminal");
    }

    if (!typing && event.key.toLowerCase() === "m") {
      startMatrix();
    }

    if (!typing && event.key.toLowerCase() === "h") {
      for (const win of windows.values()) win.hidden = true;
      activeWindow = null;
      welcome.hidden = false;
      renderTaskbar();
    }

    const pressed = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (pressed === secretKeys[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === secretKeys.length) {
        konamiIndex = 0;
        secretProtocol();
      }
    } else {
      konamiIndex = pressed === secretKeys[0] ? 1 : 0;
    }
  });

  // Original-page links are not altered. Only launch the OS on demand.
  // Keep the classic portfolio visible until the user actively opens the desktop experience.
  world.hidden = true;
  launchButton.hidden = false;
  document.body.style.overflow = "";
  boot.hidden = true;
  welcome.hidden = true;

  // Allow visitors to skip the boot panel immediately.
  boot.addEventListener("click", () => {
    clearTimeout(bootTimer);
    finishBoot();
  });

  // Make sure the world can be closed and reopened at any time.
  window.addEventListener("beforeunload", stopMatrix);
});
