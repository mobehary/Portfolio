fetch("assets/data/projects.json")
  .then(res => res.json())
  .then(projects => {
    const container = document.getElementById("projects-container");

    // Reverse array so last element comes first
    const reversedProjects = [...projects].reverse();

    container.innerHTML = reversedProjects.map(project => `
      <div class="col-md-4 col-lg-3 col-12 mb-4">
        <div class="position-relative">
          <!-- Link to details page -->
          <a href="project-details.html?id=${project.id}">
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
  });