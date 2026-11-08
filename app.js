(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const grid = document.getElementById("projectGrid");
  const status = document.getElementById("galleryStatus");
  const filters = document.getElementById("filterRow");
  const dialog = document.getElementById("projectDialog");
  let projects = [];
  let activeFilter = "All";

  document.getElementById("year").textContent = new Date().getFullYear();
  const email = config.contactEmail || "hello@daniflamesgraphics.com";
  const emailLink = document.getElementById("emailLink");
  emailLink.href = `mailto:${email}`;
  emailLink.textContent = email;
  const wa = (config.whatsappNumber || "").replace(/\D/g, "");
  if (wa) document.getElementById("whatsappLink").href = `https://wa.me/${wa}`;

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
  }

  function render() {
    const visible = projects.filter(p => activeFilter === "All" || p.category === activeFilter);
    if (!visible.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No projects in this category yet.</h3><p>Check back soon for new work.</p></div>`;
      return;
    }
    grid.innerHTML = visible.map(p => `
      <article class="project-card" data-id="${escapeHTML(p.id)}" tabindex="0" role="button" aria-label="View ${escapeHTML(p.title)}">
        <div class="project-image-wrap">
          <img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.title)}" loading="lazy">
          <div class="project-overlay"><span>View project ↗</span></div>
        </div>
        <div class="project-meta"><div><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.category || "Creative design")}</p></div><span>↗</span></div>
      </article>`).join("");
    grid.querySelectorAll(".project-card").forEach(card => {
      const open = () => showProject(projects.find(p => p.id === card.dataset.id));
      card.addEventListener("click", open);
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }});
    });
  }

  function showProject(p) {
    if (!p) return;
    document.getElementById("dialogImage").src = p.image_url;
    document.getElementById("dialogImage").alt = p.title;
    document.getElementById("dialogCategory").textContent = p.category || "Creative design";
    document.getElementById("dialogTitle").textContent = p.title;
    document.getElementById("dialogDescription").textContent = p.description || "";
    dialog.showModal();
  }
  document.getElementById("dialogClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

  filters.addEventListener("click", e => {
    const button = e.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    filters.querySelectorAll(".filter-button").forEach(b => b.classList.toggle("active", b === button));
    render();
  });

  async function loadProjects() {
    const ready = config.supabaseUrl && config.supabaseAnonKey &&
      !config.supabaseUrl.includes("YOUR_") && !config.supabaseAnonKey.includes("YOUR_");
    if (!ready || !window.supabase) {
      status.textContent = "Preview mode: add your Supabase URL and anon key in config.js to show live projects.";
      return;
    }
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data, error } = await client.from("projects")
      .select("id,title,description,category,image_url,featured,created_at")
      .eq("published", true).order("featured", {ascending:false}).order("created_at", {ascending:false});
    if (error) {
      status.textContent = "We couldn't load the portfolio right now. Please try again later.";
      console.error("Portfolio load error:", error.message);
      return;
    }
    projects = data || [];
    status.textContent = projects.length ? `${projects.length} project${projects.length === 1 ? "" : "s"} in the portfolio.` : "New work is coming soon. Check back for updates.";
    render();
  }
  loadProjects();
})();
