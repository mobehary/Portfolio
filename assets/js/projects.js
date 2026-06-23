/* =========================================
   Projects page - cards + modal + filter
   ========================================= */
(function () {
  'use strict';

  const container = document.getElementById('projects-container');
  if (!container) return;

  // Category comes from the JSON; default to 'development' for legacy entries
  function categorize(p) {
    return p.category === 'support' ? 'support' : 'development';
  }

  // Split tools string into an array
  function parseTools(s) {
    if (!s) return [];
    return s
      .split(/,| and /i)
      .map(t => t.trim())
      .filter(Boolean)
      .filter(t => t.toLowerCase() !== 'and');
  }

  const STORAGE_KEY = 'pf_projects_v1';
  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) { return null; }
  }

  // Prefer local working copy (from /admin) over the file, so newly-added
  // projects appear immediately without re-deploying projects.json.
  const local = loadLocal();
  const projectsPromise = local
    ? Promise.resolve(local)
    : fetch('assets/data/projects.json').then(r => r.json());

  projectsPromise
    .then(projects => {
      const reversed = [...projects].reverse().map(p => ({ ...p, _cat: categorize(p) }));

      container.innerHTML = reversed.map((project, i) => {
        const bg = project.mainColor || '#FFFFFF';
        const isExternal = project.link && project.link !== '#';
        const cat = project._cat;
        const catBadge = cat === 'support'
          ? '<span class="pf-project-badge support"><i class="fa-solid fa-headset"></i> Support</span>'
          : '<span class="pf-project-badge dev"><i class="fa-solid fa-code"></i> Built</span>';

        return `
          <div class="pf-project" data-index="${i}" data-cat="${cat}" style="animation-delay:${Math.min(i, 12) * 60}ms;">
            <div class="pf-project-img" style="background-color:${bg}; background-image:url(${project.image});"></div>

            <div class="pf-project-company" style="background-image:url(${project.companyLogo});" title="${project.company || ''}"></div>

            <div class="pf-project-overlay">
              ${isExternal ? `<a href="${project.link}" target="_blank" rel="noopener" title="Visit project" onclick="event.stopPropagation();"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
              <a href="#" class="pf-project-open" title="Details"><i class="fa-solid fa-circle-info"></i></a>
            </div>

            <div class="pf-project-body">
              <div class="pf-project-title-row">
                <h3>${project.title}</h3>
                ${catBadge}
              </div>
              <div class="pf-project-meta">
                <i class="fa-regular fa-calendar"></i>
                <span>${project.startDate || 'N/A'}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Filter count
      const allCount = document.querySelector('.pf-filter-count[data-count="all"]');
      if (allCount) allCount.textContent = ' (' + reversed.length + ')';

      // Modal
      const modalEl = document.getElementById('projectModal');
      const modal = new bootstrap.Modal(modalEl);

      function openModal(project) {
        const bg = project.mainColor || '#FFFFFF';
        const wrap = document.getElementById('modal-image-wrap');
        wrap.style.backgroundColor = bg;
        wrap.style.backgroundImage = 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)';
        document.getElementById('modal-project-image').src = project.image;
        document.getElementById('modal-project-title').textContent = project.title || 'Project Details';
        document.getElementById('modal-company-logo').style.backgroundImage = `url(${project.companyLogo})`;
        document.getElementById('modal-project-date').textContent = project.startDate || 'N/A';
        document.getElementById('modal-project-description').textContent = project.description || 'No description available.';

        // Tools as tags
        const toolsWrap = document.getElementById('modal-project-tools');
        const tools = parseTools(project.tools);
        if (tools.length) {
          toolsWrap.innerHTML = tools.map(t => `<span class="pf-tag">${t}</span>`).join('');
        } else {
          toolsWrap.innerHTML = '<span class="pf-tag">Private</span>';
        }

        // Company
        const companyRow = document.getElementById('modal-company-row');
        const companyVal = document.getElementById('modal-project-company');
        if (project.company && project.company !== '#') {
          companyRow.style.display = 'flex';
          companyVal.innerHTML = `<a href="https://${project.company}" target="_blank" rel="noopener" style="color:var(--pf-accent-2);">${project.company} <i class="fa-solid fa-arrow-up-right-from-square ms-1" style="font-size:11px;"></i></a>`;
        } else {
          companyRow.style.display = 'flex';
          companyVal.textContent = 'Freelance';
        }

        // Visit link
        const visit = document.getElementById('modal-project-link');
        if (project.link && project.link !== '#') {
          visit.style.display = 'inline-flex';
          visit.href = project.link;
        } else {
          visit.style.display = 'none';
        }

        modal.show();
      }

      // Cards click
      container.querySelectorAll('.pf-project').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('a') && !e.target.closest('.pf-project-open')) return;
          e.preventDefault();
          const idx = parseInt(card.getAttribute('data-index'), 10);
          openModal(reversed[idx]);
        });
      });

      // Filters
      document.querySelectorAll('.pf-filter').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.pf-filter').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const cat = this.dataset.cat;
          let visible = 0;
          container.querySelectorAll('.pf-project').forEach(card => {
            const show = cat === 'all' || card.dataset.cat === cat;
            card.style.display = show ? '' : 'none';
            if (show) visible++;
          });
          let empty = container.querySelector('.pf-empty');
          if (visible === 0) {
            if (!empty) {
              empty = document.createElement('div');
              empty.className = 'pf-empty';
              empty.innerHTML = '<i class="fa-regular fa-folder-open" style="font-size:32px; margin-bottom:10px; display:block; color:var(--pf-accent-2);"></i> No projects in this category yet.';
              container.appendChild(empty);
            }
          } else if (empty) {
            empty.remove();
          }
        });
      });
    })
    .catch(err => {
      console.error('Failed to load projects:', err);
      container.innerHTML = '<div class="pf-empty">Failed to load projects. Please try again later.</div>';
    });
})();
