fetch("assets/data/projects.json")
  .then(res => res.json())
  .then(projects => {
    const container = document.getElementById("projects-container");

    // Reverse array so last element comes first
    const reversedProjects = [...projects].reverse();

    container.innerHTML = reversedProjects.map((project, index) => `
      <div class="col-md-4 col-lg-3 col-12 mb-4">
        <div class="position-relative">
          <!-- Trigger modal instead of link -->
          <a href="#" class="open-modal" data-index="${index}">
            <div class="project-card" style="${project.mainColor ? `background-color: ${project.mainColor}` : 'background-color: #FFF'}">
              <div class="project-image" style="background-image: url(${project.image});"></div>
            </div>
          </a>

          <!-- Company -->
          <a href="https://${project.company}" class="company" target="_blank">
            <div class="company-logo" style="background-image: url(${project.companyLogo});"></div>
          </a>

          <!-- External Project Link -->
          <a href="${project.link}" class="project-link" target="_blank">
            <div class="link-icon"></div>
          </a>
        </div>
      </div>
    `).join('');

    // Modal functionality
    const modal = new bootstrap.Modal(document.getElementById('projectModal'));

    document.querySelectorAll('.open-modal').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const projectIndex = link.getAttribute('data-index');
        const project = reversedProjects[projectIndex];

        // Fill modal content
        document.getElementById('image-bg').style.backgroundColor = project.mainColor || '#FFF';
        document.getElementById('modal-project-image').src = project.image;
        document.getElementById('modal-project-date').textContent = project.startDate || "N/A";
        document.getElementById('modal-project-description').textContent = project.description || "No description available.";
        document.getElementById('modal-project-tools').textContent = project.tools || "Tools is private";

        // Show modal
        modal.show();
      });
    });
  });
