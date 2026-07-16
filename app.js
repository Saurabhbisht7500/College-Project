/* =========================================================
   app.js — main orchestrator
   ========================================================= */

const App = {
  currentLayout: 'cards',

  init(){
    this.applyStoredTheme();
    this.bindNav();
    this.bindThemeToggle();
    this.bindMobileMenu();
    this.bindForm();
    this.bindToolbar();
    this.bindLayoutToggle();
    this.bindExport();
    CalendarView.init();
    this.renderAll();
  },

  getAssignments(){
    return Storage.getAll();
  },

  renderAll(){
    const list = this.getAssignments();
    Dashboard.render(list);
    Filter.populateSubjects(list);
    this.renderList();
    CalendarView.render(list);
    this.renderStats(list);
    this.renderReminders(list);
  },

  /* ---------------- Navigation ---------------- */
  bindNav(){
    document.querySelectorAll('.tick').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tick').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + btn.dataset.view).classList.add('active');
        this.closeMobileNav();
        if(btn.dataset.view !== 'add') this.resetForm();
      });
    });
  },

  bindMobileMenu(){
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileNavOverlay');
    menuBtn.addEventListener('click', () => {
      document.querySelector('.ruler-nav').classList.add('open');
      overlay.classList.add('open');
    });
    overlay.addEventListener('click', () => this.closeMobileNav());
  },

  closeMobileNav(){
    document.querySelector('.ruler-nav').classList.remove('open');
    document.getElementById('mobileNavOverlay').classList.remove('open');
  },

  /* ---------------- Theme ---------------- */
  applyStoredTheme(){
    const theme = Storage.getTheme();
    if(theme === 'dark'){
      document.documentElement.classList.add('dark');
      document.querySelector('.theme-text').textContent = 'Paper mode';
      document.querySelector('.theme-icon').textContent = '☀';
    }
  },

  bindThemeToggle(){
    document.getElementById('themeToggle').addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      Storage.setTheme(isDark ? 'dark' : 'light');
      document.querySelector('.theme-text').textContent = isDark ? 'Paper mode' : 'Chalkboard';
      document.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
      this.renderStats(this.getAssignments()); // repaint canvas colors
    });
  },

  /* ---------------- Form (Add / Edit) ---------------- */
  bindForm(){
    const form = document.getElementById('assignmentForm');
    const fileDrop = document.getElementById('fileDrop');
    const fileInput = document.getElementById('fAttachment');

    fileDrop.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      document.getElementById('fileDropText').textContent =
        fileInput.files.length ? `Attached: ${fileInput.files[0].name}` : 'Click to attach a file (UI only — not uploaded)';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const editingId = document.getElementById('editingId').value;
      const data = {
        title: document.getElementById('fTitle').value.trim(),
        subject: document.getElementById('fSubject').value.trim(),
        teacher: document.getElementById('fTeacher').value.trim(),
        dueDate: document.getElementById('fDueDate').value,
        priority: document.getElementById('fPriority').value,
        description: document.getElementById('fDescription').value.trim(),
        attachmentName: fileInput.files.length ? fileInput.files[0].name : ''
      };

      if(!data.title || !data.subject || !data.dueDate){
        this.toast('Please fill in title, subject, and due date.');
        return;
      }

      if(editingId){
        Storage.update(editingId, data);
        this.toast('Assignment updated.');
      }else{
        Storage.add(data);
        this.toast('Assignment saved.');
      }

      this.resetForm();
      this.renderAll();
      document.querySelector('.tick[data-view="list"]').click();
    });

    document.getElementById('clearBtn').addEventListener('click', () => this.resetForm());
  },

  resetForm(){
    document.getElementById('assignmentForm').reset();
    document.getElementById('editingId').value = '';
    document.getElementById('fPriority').value = 'Medium';
    document.getElementById('fileDropText').textContent = 'Click to attach a file (UI only — not uploaded)';
    document.getElementById('saveBtn').textContent = 'Save Assignment';
  },

  editAssignment(id){
    const a = this.getAssignments().find(x => x.id === id);
    if(!a) return;
    document.getElementById('editingId').value = a.id;
    document.getElementById('fTitle').value = a.title;
    document.getElementById('fSubject').value = a.subject;
    document.getElementById('fTeacher').value = a.teacher || '';
    document.getElementById('fDueDate').value = a.dueDate;
    document.getElementById('fPriority').value = a.priority;
    document.getElementById('fDescription').value = a.description || '';
    document.getElementById('fileDropText').textContent = a.attachmentName ? `Attached: ${a.attachmentName}` : 'Click to attach a file (UI only — not uploaded)';
    document.getElementById('saveBtn').textContent = 'Update Assignment';

    document.querySelectorAll('.tick').forEach(b => b.classList.remove('active'));
    document.querySelector('.tick[data-view="add"]').classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-add').classList.add('active');
  },

  deleteAssignment(id){
    if(!confirm('Delete this assignment? This cannot be undone.')) return;
    Storage.delete(id);
    this.toast('Assignment deleted.');
    this.renderAll();
  },

  toggleComplete(id){
    const a = Storage.toggleComplete(id);
    if(a) this.toast(a.completed ? 'Marked complete. Nice work.' : 'Marked pending again.');
    this.renderAll();
  },

  /* ---------------- Card rendering (shared) ---------------- */
  assignmentCardHtml(a){
    const status = Utils.getStatus(a);
    const stampCls = Utils.stampClass(a);
    return `
    <article class="assignment-card ${a.completed ? 'is-complete':''}" data-priority="${a.priority}" data-id="${a.id}">
      <div class="card-top">
        <div>
          <h3 class="card-title">${Utils.escapeHtml(a.title)}</h3>
          <div class="card-subject">${Utils.escapeHtml(a.subject)}</div>
        </div>
        <span class="due-stamp ${stampCls}">${Utils.escapeHtml(Utils.formatDate(a.dueDate))}</span>
      </div>
      <div class="card-meta">
        <span class="pill pill-${a.priority}">${a.priority}</span>
        <span class="pill pill-${status}">${status}</span>
        <span>${Utils.daysRemainingLabel(a)}</span>
        ${a.teacher ? `<span>· ${Utils.escapeHtml(a.teacher)}</span>` : ''}
      </div>
      ${a.description ? `<p class="card-desc">${Utils.escapeHtml(a.description)}</p>` : ''}
      <div class="card-actions">
        <button class="icon-btn edit-btn" data-action="edit" data-id="${a.id}">✏ Edit</button>
        <button class="icon-btn delete-btn" data-action="delete" data-id="${a.id}">🗑 Delete</button>
        <button class="icon-btn complete-btn" data-action="complete" data-id="${a.id}">${a.completed ? '↺ Undo' : '✅ Complete'}</button>
      </div>
    </article>`;
  },

  bindCardActions(container){
    container.querySelectorAll('[data-action]').forEach(btn => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      btn.addEventListener('click', () => {
        if(action === 'edit') this.editAssignment(id);
        if(action === 'delete') this.deleteAssignment(id);
        if(action === 'complete') this.toggleComplete(id);
      });
    });
  },

  /* ---------------- List view ---------------- */
  bindToolbar(){
    ['searchInput','filterSubject','filterPriority','filterStatus','sortBy'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => this.renderList());
      document.getElementById(id).addEventListener('change', () => this.renderList());
    });
  },

  bindLayoutToggle(){
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLayout = btn.dataset.layout;
        document.getElementById('assignmentCards').style.display = this.currentLayout === 'cards' ? 'grid' : 'none';
        document.getElementById('assignmentTableWrap').style.display = this.currentLayout === 'table' ? 'block' : 'none';
      });
    });
  },

  renderList(){
    const list = this.getAssignments();
    const filtered = Filter.apply(list);
    const emptyNote = document.getElementById('listEmptyNote');
    emptyNote.style.display = filtered.length ? 'none' : 'block';

    const cardsEl = document.getElementById('assignmentCards');
    cardsEl.innerHTML = filtered.map(a => this.assignmentCardHtml(a)).join('');
    this.bindCardActions(cardsEl);

    const tbody = document.getElementById('assignmentTableBody');
    tbody.innerHTML = filtered.map(a => {
      const status = Utils.getStatus(a);
      return `<tr class="${a.completed ? 'is-complete':''}">
        <td>${Utils.escapeHtml(a.title)}</td>
        <td>${Utils.escapeHtml(a.subject)}</td>
        <td>${Utils.formatDate(a.dueDate)}</td>
        <td>${Utils.daysRemainingLabel(a)}</td>
        <td><span class="pill pill-${a.priority}">${a.priority}</span></td>
        <td><span class="pill pill-${status}">${status}</span></td>
        <td class="table-actions">
          <button class="icon-btn edit-btn" data-action="edit" data-id="${a.id}">✏</button>
          <button class="icon-btn delete-btn" data-action="delete" data-id="${a.id}">🗑</button>
          <button class="icon-btn complete-btn" data-action="complete" data-id="${a.id}">✅</button>
        </td>
      </tr>`;
    }).join('');
    this.bindCardActions(tbody);
  },

  /* ---------------- Reminders ---------------- */
  renderReminders(list){
    const overdue = list.filter(a => !a.completed && Utils.daysBetween(a.dueDate) < 0);
    const today = list.filter(a => !a.completed && Utils.daysBetween(a.dueDate) === 0);
    const tomorrow = list.filter(a => !a.completed && Utils.daysBetween(a.dueDate) === 1);

    const fill = (id, arr) => {
      const el = document.querySelector(`#${id} .card-list`);
      el.innerHTML = arr.length
        ? arr.map(a => this.assignmentCardHtml(a)).join('')
        : `<p class="empty-note">Nothing here.</p>`;
      this.bindCardActions(el);
    };
    fill('reminderOverdue', overdue);
    fill('reminderToday', today);
    fill('reminderTomorrow', tomorrow);
  },

  /* ---------------- Statistics ---------------- */
  renderStats(list){
    const stats = Dashboard.computeStats(list);
    document.getElementById('stTotal').textContent = stats.total;
    document.getElementById('stCompleted').textContent = stats.completed;
    document.getElementById('stPending').textContent = stats.pending;
    document.getElementById('stHighPriority').textContent = stats.highPriority;
    document.getElementById('stPercent').textContent = stats.pct + '%';

    this.drawDonut(stats.pct);
    this.drawBarChart('subjectBarChart', this.groupCount(list, 'subject'));
    this.drawBarChart('priorityBarChart', this.groupCount(list, 'priority'), ['High','Medium','Low']);
  },

  groupCount(list, key){
    const counts = {};
    list.forEach(a => { counts[a[key]] = (counts[a[key]]||0) + 1; });
    return counts;
  },

  drawDonut(pct){
    const canvas = document.getElementById('completionChart');
    const ctx = canvas.getContext('2d');
    const styles = getComputedStyle(document.documentElement);
    const track = styles.getPropertyValue('--rule-line').trim();
    const fill = styles.getPropertyValue('--accent-sage').trim();
    const ink = styles.getPropertyValue('--ink').trim();

    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cx = canvas.width/2, cy = canvas.height/2, r = 100, lineWidth = 22;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = track;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    if(pct > 0){
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (Math.PI*2*(pct/100)));
      ctx.strokeStyle = fill;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.fillStyle = ink;
    ctx.font = '600 30px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pct + '%', cx, cy);
  },

  drawBarChart(containerId, counts, forceOrder){
    const container = document.getElementById(containerId);
    const entries = forceOrder
      ? forceOrder.map(k => [k, counts[k]||0])
      : Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,6);
    const max = Math.max(1, ...entries.map(e => e[1]));

    container.innerHTML = entries.length
      ? entries.map(([label,count]) => `
        <div class="bar-row">
          <span class="bar-label" title="${Utils.escapeHtml(label)}">${Utils.escapeHtml(label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(count/max)*100}%"></div></div>
          <span class="bar-count">${count}</span>
        </div>`).join('')
      : `<p class="empty-note">No data yet.</p>`;
  },

  /* ---------------- Export ---------------- */
  bindExport(){
    document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCsv());
    document.getElementById('exportPdfBtn').addEventListener('click', () => window.print());
  },

  exportCsv(){
    const list = Filter.apply(this.getAssignments());
    if(list.length === 0){ this.toast('No assignments to export.'); return; }
    const headers = ['Title','Subject','Teacher','Due Date','Priority','Status','Description'];
    const rows = list.map(a => [
      a.title, a.subject, a.teacher||'', a.dueDate, a.priority, Utils.getStatus(a), (a.description||'').replace(/\n/g,' ')
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'assignments.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.toast('CSV exported.');
  },

  /* ---------------- Toast ---------------- */
  toast(message){
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());