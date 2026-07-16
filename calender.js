/* =========================================================
   calendar.js — month grid rendering + day detail
   ========================================================= */

const CalendarView = {
  current: new Date(),

  init(){
    document.getElementById('calPrev').addEventListener('click', () => {
      this.current.setMonth(this.current.getMonth() - 1);
      this.render(App.getAssignments());
    });
    document.getElementById('calNext').addEventListener('click', () => {
      this.current.setMonth(this.current.getMonth() + 1);
      this.render(App.getAssignments());
    });
  },

  render(list){
    const year = this.current.getFullYear();
    const month = this.current.getMonth();
    document.getElementById('calMonthLabel').textContent =
      this.current.toLocaleDateString('en-US', { month:'long', year:'numeric' });

    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const todayStr = Utils.todayStr();

    // map date -> assignments due that day
    const byDate = {};
    list.forEach(a => {
      if(!byDate[a.dueDate]) byDate[a.dueDate] = [];
      byDate[a.dueDate].push(a);
    });

    const grid = document.getElementById('calendarGrid');
    let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      .map(d => `<div class="cal-dow">${d}</div>`).join('');

    for(let i=0;i<startOffset;i++){
      html += `<div class="cal-cell blank"></div>`;
    }

    for(let day=1; day<=daysInMonth; day++){
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const dayAssignments = byDate[dateStr] || [];
      const isToday = dateStr === todayStr;
      const dayColorClass = `day-${((day - 1) % 7) + 1}`;
      let dots = '';
      dayAssignments.forEach(a => {
        const status = Utils.getStatus(a);
        const cls = status === 'Overdue' ? 'dot-overdue' : (status === 'Completed' ? 'dot-due' : 'dot-due');
        dots += `<span class="dot ${cls}"></span>`;
      });
      html += `<div class="cal-cell ${isToday?'is-today':''} ${dayColorClass}" data-date="${dateStr}">
        <div class="cal-daynum">${day}</div>
        <div class="cal-dots">${dots}</div>
      </div>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        this.showDayDetail(cell.dataset.date, byDate[cell.dataset.date] || []);
      });
    });
  },

  showDayDetail(dateStr, assignments){
    const el = document.getElementById('calendarDayDetail');
    if(assignments.length === 0){
      el.innerHTML = `<h3 class="section-heading" style="font-size:16px;">${Utils.formatDate(dateStr)}</h3><p class="empty-note">Nothing due this day.</p>`;
      return;
    }
    el.innerHTML = `<h3 class="section-heading" style="font-size:16px;">${Utils.formatDate(dateStr)}</h3>
      <div class="card-list">${assignments.map(a => App.assignmentCardHtml(a)).join('')}</div>`;
    App.bindCardActions(el);
  }
};