const STORAGE_KEY = 'gradconnect_users_v3';
const SESSION_KEY = 'gradconnect_session_v3';

const defaultJobs = [
  { id: 'job-1', title: 'Software Engineer', company: 'iGlobe', location: 'Pretoria Centurion Irene Link', type: 'Full-time', posted: 'Posted 1h ago', letter: 'I' },
  { id: 'job-2', title: 'Junior Developer', company: 'SuperTech', location: 'Cape Town Waterfront', type: 'Full-time', posted: 'Posted 3h ago', letter: 'S' },
  { id: 'job-3', title: 'Software Developer', company: 'Softwave', location: 'Remote Flexible', type: 'Remote', posted: 'Posted 6h ago', letter: 'S' }
];

const defaultHackathons = [
  { id: 'hack-1', title: 'AI Innovation Hackathon 2026', org: 'Online', date: '20 Jun - 22 Jun 2026', desc: 'Build AI solutions for real-world problems.', letter: 'AI' },
  { id: 'hack-2', title: 'Build for Good Hackathon 2026', org: 'Cape Town Waterfront', date: '5 Aug - 7 Aug 2026', desc: 'Create impactful solutions for communities.', letter: 'BFG' },
  { id: 'hack-3', title: 'Blockchain Challenge 2026', org: 'Innovation Lab', date: '15 Oct - 18 Oct 2026', desc: 'Build trust-based apps using blockchain.', letter: 'BC' }
];

const recommendedCerts = [
  { id: 'rec-1', name: 'CompTIA A+', provider: 'CompTIA', status: 'Recommended', progress: 0, desc: 'Good for IT support, hardware, software and troubleshooting fundamentals.' },
  { id: 'rec-2', name: 'Cisco CCNA', provider: 'Cisco', status: 'Recommended', progress: 0, desc: 'Useful for networking, routing, switching and junior network support roles.' },
  { id: 'rec-3', name: 'Microsoft Azure Fundamentals', provider: 'Microsoft', status: 'Recommended', progress: 0, desc: 'Entry-level cloud certification for Azure services and cloud concepts.' },
  { id: 'rec-4', name: 'AWS Cloud Practitioner', provider: 'Amazon Web Services', status: 'Recommended', progress: 0, desc: 'Beginner cloud certification for AWS foundations and cloud careers.' },
  { id: 'rec-5', name: 'Google IT Support Certificate', provider: 'Google', status: 'Recommended', progress: 0, desc: 'Beginner-friendly certificate for helpdesk, support and troubleshooting skills.' }
];

let currentUser = null;
let activeCertFilter = 'all';

function defaultSettings(){
  return {
    jobAlerts: true,
    certReminders: true,
    hackathonUpdates: true,
    weeklySummary: false,
    theme: 'light',
    accent: 'brown',
    profileVisible: true,
    showEmail: true,
    showLinks: true
  };
}

function defaultProfile(skill = 'IT Graduate'){
  return {
    location: 'South Africa',
    phone: '',
    skills: skill ? [skill, 'HTML', 'CSS'] : ['HTML', 'CSS'],
    github: '',
    linkedin: '',
    about: 'Passionate about building innovative solutions and continuously learning new technologies.'
  };
}

function users(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveUsers(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function normalizeUser(user){
  user.appliedJobs = user.appliedJobs || [];
  user.certifications = user.certifications || [];
  user.joinedHackathons = user.joinedHackathons || [];
  user.projects = user.projects || [];
  user.activity = user.activity || [];
  user.profile = { ...defaultProfile(user.skill), ...(user.profile || {}) };
  user.settings = { ...defaultSettings(), ...(user.settings || {}) };
  return user;
}

function saveCurrentUser(previousEmail){
  const emailToReplace = previousEmail || currentUser.email;
  const list = users().map(u => u.email === emailToReplace ? currentUser : u);
  saveUsers(list);
  localStorage.setItem(SESSION_KEY, currentUser.email);
}

function freshUser(name, email, password, skill){
  return normalizeUser({
    name,
    email,
    password,
    skill,
    appliedJobs: [],
    certifications: [],
    joinedHackathons: [],
    projects: [],
    activity: []
  });
}

function addActivity(text){
  currentUser.activity.unshift({ text, time: new Date().toLocaleString() });
  currentUser.activity = currentUser.activity.slice(0, 8);
  saveCurrentUser();
  renderAll();
}

function toast(message){
  const old = document.querySelector('.toast');
  if(old) old.remove();
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2600);
}

function initials(name){
  if(!name) return '👤';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(part => part[0]).join('').toUpperCase();
}

function cleanProgress(value){
  const number = Number(value);
  if(Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function certStatusFromProgress(status, progress){
  if(progress >= 100) return 'Completed';
  if(status === 'Completed') return 'Completed';
  if(progress > 0) return 'In Progress';
  return status || 'Not Started';
}

const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginCard = document.getElementById('loginCard');
const registerCard = document.getElementById('registerCard');
const profileModal = document.getElementById('profileModal');
const certModal = document.getElementById('certModal');

function showLogin(){ loginCard.classList.add('active'); registerCard.classList.remove('active'); }
function showRegister(){ registerCard.classList.add('active'); loginCard.classList.remove('active'); }

function openProfileModal(){
  currentUser = normalizeUser(currentUser);
  document.getElementById('editName').value = currentUser.name || '';
  document.getElementById('editSkill').value = currentUser.skill || '';
  document.getElementById('editLocation').value = currentUser.profile.location || '';
  document.getElementById('editPhone').value = currentUser.profile.phone || '';
  document.getElementById('editSkills').value = (currentUser.profile.skills || []).join(', ');
  document.getElementById('editGithub').value = currentUser.profile.github || '';
  document.getElementById('editLinkedin').value = currentUser.profile.linkedin || '';
  document.getElementById('editAbout').value = currentUser.profile.about || '';
  profileModal.classList.remove('hidden');
  profileModal.setAttribute('aria-hidden', 'false');
}

function closeProfileModal(){
  profileModal.classList.add('hidden');
  profileModal.setAttribute('aria-hidden', 'true');
}

function openCertModal(certId = ''){
  const form = document.getElementById('certForm');
  form.reset();
  document.getElementById('certId').value = '';
  document.getElementById('certProgress').value = 0;
  document.getElementById('certStatus').value = 'Not Started';
  document.getElementById('certModalTitle').textContent = 'Add Certification';

  if(certId){
    const cert = currentUser.certifications.find(c => c.id === certId);
    if(cert){
      document.getElementById('certModalTitle').textContent = 'Edit Certification';
      document.getElementById('certId').value = cert.id;
      document.getElementById('certName').value = cert.name || '';
      document.getElementById('certProvider').value = cert.provider || '';
      document.getElementById('certStatus').value = cert.status || 'Not Started';
      document.getElementById('certProgress').value = cleanProgress(cert.progress);
      document.getElementById('certStartDate').value = cert.startDate || '';
      document.getElementById('certTargetDate').value = cert.targetDate || '';
      document.getElementById('certNotes').value = cert.notes || '';
    }
  }

  certModal.classList.remove('hidden');
  certModal.setAttribute('aria-hidden', 'false');
}

function closeCertModal(){
  certModal.classList.add('hidden');
  certModal.setAttribute('aria-hidden', 'true');
}

document.getElementById('goRegister').addEventListener('click', showRegister);
document.getElementById('goLogin').addEventListener('click', showLogin);
document.getElementById('backLogin').addEventListener('click', showLogin);
document.getElementById('showLoginBtn').addEventListener('click', showLogin);
document.getElementById('editProfileBtn').addEventListener('click', openProfileModal);
document.getElementById('closeProfileModal').addEventListener('click', closeProfileModal);
document.getElementById('cancelProfileEdit').addEventListener('click', closeProfileModal);
profileModal.addEventListener('click', e => { if(e.target === profileModal) closeProfileModal(); });

document.getElementById('addCertBtn').addEventListener('click', () => openCertModal());
document.getElementById('closeCertModal').addEventListener('click', closeCertModal);
document.getElementById('cancelCertEdit').addEventListener('click', closeCertModal);
certModal.addEventListener('click', e => { if(e.target === certModal) closeCertModal(); });

document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const skill = document.getElementById('regSkill').value;
  if(password !== confirm) return toast('Passwords do not match.');
  const list = users();
  if(list.some(u => u.email === email)) return toast('This email is already registered. Please login.');
  list.push(freshUser(name, email, password, skill));
  saveUsers(list);
  e.target.reset();
  showLogin();
  document.getElementById('loginEmail').value = email;
  toast('Account created. Please login to continue.');
});

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const found = users().find(u => u.email === email && u.password === password);
  if(!found) return toast('Invalid login details or account not registered.');
  currentUser = normalizeUser(found);
  saveCurrentUser();
  localStorage.setItem(SESSION_KEY, email);
  authScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  applyAppearance();
  renderAll();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  mainApp.classList.add('hidden');
  authScreen.classList.remove('hidden');
  document.body.classList.remove('dark-theme');
  showLogin();
});

document.querySelectorAll('[data-page]').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id));
}

function certStats(){
  const total = currentUser.certifications.length;
  const completed = currentUser.certifications.filter(c => c.status === 'Completed' || Number(c.progress) >= 100).length;
  const inProgress = currentUser.certifications.filter(c => c.status === 'In Progress' && Number(c.progress) < 100).length;
  const avg = total ? Math.round(currentUser.certifications.reduce((sum,c)=>sum + cleanProgress(c.progress),0)/total) : 0;
  return { total, completed, inProgress, avg };
}

function renderAll(){
  if(!currentUser) return;
  currentUser = normalizeUser(currentUser);

  document.getElementById('topUserName').textContent = currentUser.name;
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profileSkill').textContent = currentUser.skill || 'IT Graduate';
  document.getElementById('profileLocation').textContent = `📍 ${currentUser.profile.location || 'South Africa'}`;
  document.getElementById('profileEmail').textContent = currentUser.settings.showEmail ? currentUser.email : 'Email hidden';
  document.getElementById('profilePhone').textContent = currentUser.profile.phone || 'No phone number added';
  document.getElementById('profileAvatar').textContent = initials(currentUser.name);
  document.getElementById('profileAbout').textContent = currentUser.profile.about || 'No about section added yet.';

  renderProfileLinks();
  renderProfileSkills();
  renderSettingsForms();
  applyAppearance();

  const cert = certStats();
  const counts = {
    jobs: currentUser.appliedJobs.length,
    certs: cert.total,
    hacks: currentUser.joinedHackathons.length,
    projects: currentUser.projects.length
  };
  document.getElementById('jobsAppliedCount').textContent = counts.jobs;
  document.getElementById('certCount').textContent = counts.certs;
  document.getElementById('hackCount').textContent = counts.hacks;
  document.getElementById('portfolioCount').textContent = counts.projects;
  document.getElementById('profileJobs').textContent = counts.jobs;
  document.getElementById('profileCerts').textContent = counts.certs;
  document.getElementById('profileHacks').textContent = counts.hacks;
  document.getElementById('profileProjects').textContent = counts.projects;

  renderActivity();
  renderJobs();
  renderCerts();
  renderHackathons();
  renderProjects();
}

function renderProfileLinks(){
  const github = document.getElementById('profileGithub');
  const linkedin = document.getElementById('profileLinkedin');
  const showLinks = currentUser.settings.showLinks;

  setProfileLink(github, currentUser.profile.github, 'GitHub');
  setProfileLink(linkedin, currentUser.profile.linkedin, 'LinkedIn');

  github.style.display = showLinks ? 'inline-flex' : 'none';
  linkedin.style.display = showLinks ? 'inline-flex' : 'none';
}

function setProfileLink(element, url, label){
  if(url){
    element.href = url;
    element.textContent = label;
    element.classList.remove('disabled-link');
  } else {
    element.href = '#';
    element.textContent = `${label} not added`;
    element.classList.add('disabled-link');
  }
}

function renderProfileSkills(){
  const list = document.getElementById('profileSkillsList');
  const skills = currentUser.profile.skills && currentUser.profile.skills.length ? currentUser.profile.skills : ['No skills added yet'];
  list.innerHTML = skills.map(skill => `<span>${skill}</span>`).join('');
}

function renderSettingsForms(){
  document.getElementById('settingName').value = currentUser.name || '';
  document.getElementById('settingEmail').value = currentUser.email || '';
  document.getElementById('jobAlerts').checked = currentUser.settings.jobAlerts;
  document.getElementById('certReminders').checked = currentUser.settings.certReminders;
  document.getElementById('hackathonUpdates').checked = currentUser.settings.hackathonUpdates;
  document.getElementById('weeklySummary').checked = currentUser.settings.weeklySummary;
  document.getElementById('themeSelect').value = currentUser.settings.theme;
  document.getElementById('accentSelect').value = currentUser.settings.accent;
  document.getElementById('profileVisible').checked = currentUser.settings.profileVisible;
  document.getElementById('showEmail').checked = currentUser.settings.showEmail;
  document.getElementById('showLinks').checked = currentUser.settings.showLinks;
}

function renderActivity(){
  const box = document.getElementById('activityList');
  if(!currentUser.activity.length){
    box.className = 'empty-state';
    box.textContent = 'No activity yet. Start by applying for a job, adding a certification, joining a hackathon or creating a portfolio project.';
    return;
  }
  box.className = 'cards-list';
  box.innerHTML = currentUser.activity.map(a => `<div class="project-item">★ ${a.text}<br><small class="muted">${a.time}</small></div>`).join('');
}

function renderJobs(){
  const list = document.getElementById('jobsList');
  list.innerHTML = defaultJobs.map(job => {
    const applied = currentUser.appliedJobs.includes(job.id);
    return `<div class="job-card">
      <div class="card-icon">${job.letter}</div>
      <div><h3>${job.title}</h3><p><strong>${job.company}</strong></p><p>📍 ${job.location} <span class="pill">${job.type}</span></p></div>
      <div><p class="muted">${job.posted}</p><button class="primary-btn ${applied ? 'applied' : ''}" onclick="applyJob('${job.id}')">${applied ? 'Applied' : 'Apply'}</button></div>
    </div>`;
  }).join('');
}

window.applyJob = function(id){
  if(currentUser.appliedJobs.includes(id)) return;
  const job = defaultJobs.find(j => j.id === id);
  currentUser.appliedJobs.push(id);
  addActivity(`You applied for ${job.title} at ${job.company}.`);
  toast('Application tracked.');
};

function renderCerts(){
  const list = document.getElementById('certList');
  const stats = certStats();

  document.getElementById('certTotalCount').textContent = stats.total;
  document.getElementById('certCompletedCount').textContent = stats.completed;
  document.getElementById('certProgressCount').textContent = stats.inProgress;
  document.getElementById('overallProgress').textContent = stats.avg + '%';
  document.getElementById('overallBar').style.width = stats.avg + '%';

  document.querySelectorAll('.cert-tabs button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.certFilter === activeCertFilter);
  });

  if(activeCertFilter === 'recommended'){
    list.innerHTML = recommendedCerts.map(c => `<div class="simple-card cert-card">
      <div class="card-icon">${c.name.split(' ').map(w => w[0]).slice(0,2).join('')}</div>
      <div>
        <h3>${c.name}</h3>
        <p><strong>${c.provider}</strong></p>
        <p>${c.desc}</p>
        <span class="pill">Recommended</span>
      </div>
      <button class="primary-btn" onclick="addRecommendedCert('${c.id}')">Add to Tracker</button>
    </div>`).join('');
    return;
  }

  let certs = [...currentUser.certifications];
  if(activeCertFilter === 'in-progress') certs = certs.filter(c => c.status === 'In Progress');
  if(activeCertFilter === 'completed') certs = certs.filter(c => c.status === 'Completed' || Number(c.progress) >= 100);

  if(!certs.length){
    list.innerHTML = `<div class="empty-state">No certifications here yet. Click <strong>Add Certification</strong> or open the <strong>Recommended</strong> tab to add one.</div>`;
    return;
  }

  list.innerHTML = certs.map(c => `<div class="simple-card cert-card">
    <div class="card-icon">${(c.name || 'C').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}</div>
    <div>
      <h3>${c.name}</h3>
      <p><strong>${c.provider || 'Provider not added'}</strong></p>
      <div class="progress"><span style="width:${cleanProgress(c.progress)}%"></span></div>
      <p>${cleanProgress(c.progress)}% complete</p>
      <div class="cert-meta">
        ${c.startDate ? `<span>Started: ${c.startDate}</span>` : ''}
        ${c.targetDate ? `<span>Target: ${c.targetDate}</span>` : ''}
      </div>
      ${c.notes ? `<p class="cert-notes">${c.notes}</p>` : ''}
    </div>
    <div class="cert-actions">
      <span class="pill">${c.status}</span>
      <button class="ghost-btn dark small-btn" onclick="editCert('${c.id}')">Edit</button>
      <button class="danger-btn small-btn" onclick="deleteCert('${c.id}')">Delete</button>
    </div>
  </div>`).join('');
}

document.querySelectorAll('.cert-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    activeCertFilter = btn.dataset.certFilter;
    renderCerts();
  });
});

document.getElementById('certForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('certId').value;
  const progress = cleanProgress(document.getElementById('certProgress').value);
  const rawStatus = document.getElementById('certStatus').value;
  const cert = {
    id: id || `cert-${Date.now()}`,
    name: document.getElementById('certName').value.trim(),
    provider: document.getElementById('certProvider').value.trim(),
    status: certStatusFromProgress(rawStatus, progress),
    progress,
    startDate: document.getElementById('certStartDate').value,
    targetDate: document.getElementById('certTargetDate').value,
    notes: document.getElementById('certNotes').value.trim()
  };

  if(!cert.name || !cert.provider) return toast('Certification name and provider are required.');

  if(id){
    currentUser.certifications = currentUser.certifications.map(c => c.id === id ? cert : c);
    addActivity(`You updated certification: ${cert.name}.`);
    toast('Certification updated.');
  } else {
    currentUser.certifications.push(cert);
    addActivity(`You added certification: ${cert.name}.`);
    toast('Certification added.');
  }

  closeCertModal();
});

window.editCert = function(id){ openCertModal(id); };

window.deleteCert = function(id){
  const cert = currentUser.certifications.find(c => c.id === id);
  if(!cert) return;
  if(!confirm(`Delete ${cert.name}?`)) return;
  currentUser.certifications = currentUser.certifications.filter(c => c.id !== id);
  addActivity(`You deleted certification: ${cert.name}.`);
  toast('Certification deleted.');
};

window.addRecommendedCert = function(id){
  const cert = recommendedCerts.find(c => c.id === id);
  if(!cert) return;
  if(currentUser.certifications.some(c => c.name.toLowerCase() === cert.name.toLowerCase())){
    return toast('This certification is already in your tracker.');
  }
  currentUser.certifications.push({
    id: `cert-${Date.now()}`,
    name: cert.name,
    provider: cert.provider,
    status: 'Not Started',
    progress: 0,
    startDate: '',
    targetDate: '',
    notes: cert.desc
  });
  activeCertFilter = 'all';
  addActivity(`You added recommended certification: ${cert.name}.`);
  toast('Recommended certification added.');
};

function renderHackathons(){
  const list = document.getElementById('hackList');
  list.innerHTML = defaultHackathons.map(h => {
    const joined = currentUser.joinedHackathons.includes(h.id);
    const actionButtons = joined
      ? `<div class="button-group"><button class="primary-btn applied" disabled>Joined</button><button class="danger-btn small-btn" onclick="leaveHack('${h.id}')">Deregister</button></div>`
      : `<button class="primary-btn" onclick="joinHack('${h.id}')">Join</button>`;
    return `<div class="simple-card">
      <div class="card-icon">${h.letter}</div>
      <div><h3>${h.title}</h3><p>📍 ${h.org}</p><p>📅 ${h.date}</p><p>${h.desc}</p></div>
      ${actionButtons}
    </div>`;
  }).join('');
}

window.joinHack = function(id){
  if(currentUser.joinedHackathons.includes(id)) return;
  const h = defaultHackathons.find(x => x.id === id);
  currentUser.joinedHackathons.push(id);
  addActivity(`You joined ${h.title}.`);
  toast('Hackathon joined.');
};

window.leaveHack = function(id){
  const h = defaultHackathons.find(x => x.id === id);
  if(!h || !currentUser.joinedHackathons.includes(id)) return;
  if(!confirm(`Deregister from ${h.title}?`)) return;
  currentUser.joinedHackathons = currentUser.joinedHackathons.filter(hackId => hackId !== id);
  addActivity(`You deregistered from ${h.title}.`);
  toast('You have been deregistered from the hackathon.');
};

document.getElementById('portfolioForm').addEventListener('submit', e => {
  e.preventDefault();
  const project = {
    id:'project-'+Date.now(),
    title: document.getElementById('projectTitle').value.trim(),
    desc: document.getElementById('projectDesc').value.trim(),
    tech: document.getElementById('projectTech').value.trim(),
    repo: document.getElementById('projectRepo').value.trim()
  };
  currentUser.projects.push(project);
  e.target.reset();
  addActivity(`You added portfolio project: ${project.title}.`);
  toast('Project added.');
});

function renderProjects(){
  const list = document.getElementById('projectList');
  if(!currentUser.projects.length){
    list.className = 'empty-state';
    list.textContent = 'No portfolio projects yet.';
    return;
  }
  list.className = '';
  list.innerHTML = currentUser.projects.map(p => `<div class="project-item">
    <div class="project-head"><strong>${p.title}</strong><button class="danger-btn small-btn" onclick="removeProject('${p.id}')">Remove Project</button></div>
    <p>${p.desc}</p>
    <p><span class="pill">${p.tech}</span></p>
    ${p.repo ? `<small>${p.repo}</small>` : ''}
  </div>`).join('');
}

window.removeProject = function(id){
  const project = currentUser.projects.find(p => p.id === id);
  if(!project) return;
  if(!confirm(`Remove ${project.title} from your projects?`)) return;
  currentUser.projects = currentUser.projects.filter(p => p.id !== id);
  addActivity(`You removed portfolio project: ${project.title}.`);
  toast('Project removed.');
};

document.getElementById('profileForm').addEventListener('submit', e => {
  e.preventDefault();
  currentUser.name = document.getElementById('editName').value.trim();
  currentUser.skill = document.getElementById('editSkill').value.trim() || 'IT Graduate';
  currentUser.profile.location = document.getElementById('editLocation').value.trim() || 'South Africa';
  currentUser.profile.phone = document.getElementById('editPhone').value.trim();
  currentUser.profile.skills = document.getElementById('editSkills').value.split(',').map(s => s.trim()).filter(Boolean);
  currentUser.profile.github = document.getElementById('editGithub').value.trim();
  currentUser.profile.linkedin = document.getElementById('editLinkedin').value.trim();
  currentUser.profile.about = document.getElementById('editAbout').value.trim();
  saveCurrentUser();
  closeProfileModal();
  renderAll();
  toast('Profile updated.');
});

document.getElementById('accountSettingsForm').addEventListener('submit', e => {
  e.preventDefault();
  const oldEmail = currentUser.email;
  const newName = document.getElementById('settingName').value.trim();
  const newEmail = document.getElementById('settingEmail').value.trim().toLowerCase();
  if(!newName || !newEmail) return toast('Name and email are required.');
  if(newEmail !== oldEmail && users().some(u => u.email === newEmail)) return toast('That email is already used by another account.');
  currentUser.name = newName;
  currentUser.email = newEmail;
  saveCurrentUser(oldEmail);
  renderAll();
  toast('Account details saved.');
});

document.getElementById('passwordSettingsForm').addEventListener('submit', e => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  if(currentPassword !== currentUser.password) return toast('Current password is incorrect.');
  if(!newPassword || newPassword.length < 4) return toast('New password must be at least 4 characters.');
  currentUser.password = newPassword;
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  saveCurrentUser();
  toast('Password updated.');
});

function updateSetting(key, value){
  currentUser.settings[key] = value;
  saveCurrentUser();
  applyAppearance();
  renderProfileLinks();
  document.getElementById('profileEmail').textContent = currentUser.settings.showEmail ? currentUser.email : 'Email hidden';
  toast('Setting updated.');
}

['jobAlerts', 'certReminders', 'hackathonUpdates', 'weeklySummary', 'profileVisible', 'showEmail', 'showLinks'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => updateSetting(id, e.target.checked));
});

document.getElementById('themeSelect').addEventListener('change', e => updateSetting('theme', e.target.value));
document.getElementById('accentSelect').addEventListener('change', e => updateSetting('accent', e.target.value));

document.getElementById('clearDemoDataBtn').addEventListener('click', () => {
  if(!confirm('Clear your demo activity and start fresh?')) return;
  currentUser.appliedJobs = [];
  currentUser.certifications = [];
  currentUser.joinedHackathons = [];
  currentUser.projects = [];
  currentUser.activity = [];
  saveCurrentUser();
  renderAll();
  toast('Demo data cleared.');
});

function applyAppearance(){
  if(!currentUser) return;
  document.body.classList.toggle('dark-theme', currentUser.settings.theme === 'dark');
  document.body.dataset.accent = currentUser.settings.accent || 'brown';
}

// Keep users logged out by default, because the project flow requires Register -> Login.
(function init(){
  localStorage.removeItem(SESSION_KEY);
  showLogin();
})();
