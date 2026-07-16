/* =========================================================
   dashboard.js — shared date utilities + dashboard rendering
   ========================================================= */

const Utils = {
  todayStr(){
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  },

  parseDate(str){
    // interpret YYYY-MM-DD as local midnight, not UTC
    const [y,m,d] = str.split('-').map(Number);
    return new Date(y, m-1, d);
  },

  daysBetween(dueDateStr){
    const today = this.parseDate(this.todayStr());
    const due = this.parseDate(dueDateStr);
    const diffMs = due.setHours(0,0,0,0) - today.setHours(0,0,0,0);
    return Math.round(diffMs / 86400000);
  },

  getStatus(a){
    if(a.completed) return 'Completed';
    const days = this.daysBetween(a.dueDate);
    return days < 0 ? 'Overdue' : 'Pending';
  },

  daysRemainingLabel(a){
    const days = this.daysBetween(a.dueDate);
    if(a.completed) return 'Done';
    if(days === 0) return 'Due today';
    if(days === 1) return 'Due tomorrow';
    if(days > 1) return `${days} days left`;
    if(days === -1) return 'Overdue by 1 day';
    return `Overdue by ${Math.abs(days)} days`;
  },

  stampClass(a){
    if(a.completed) return 'ok';
    const days = this.daysBetween(a.dueDate);
    if(days < 0) return 'overdue';
    if(days <= 1) return 'soon';
    return 'ok';
  },

  formatDate(str){
    const d = this.parseDate(str);
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  },

  escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }
};

const Dashboard = {
  computeStats(list){
    const total = list.length;
    const completed = list.filter(a => a.completed).length;
    const overdue = list.filter(a => !a.completed && Utils.daysBetween(a.dueDate) < 0).length;
    const pending = total - completed - overdue;
    const highPriority = list.filter(a => a.priority === 'High' && !a.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed/total)*100);
    return { total, completed, overdue, pending, highPriority, pct };
  },

  render(list){
    const stats = this.computeStats(list);
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statCompleted').textContent = stats.completed;
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statOverdue').textContent = stats.overdue;
    document.getElementById('progressPercentLabel').textContent = stats.pct + '%';
    document.getElementById('dashboardProgressFill').style.width = stats.pct + '%';

    const today = new Date();
    document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

    const sub = document.getElementById('welcomeSub');
    if(stats.overdue > 0){
      sub.textContent = `You have ${stats.overdue} overdue assignment${stats.overdue===1?'':'s'} — worth a look.`;
    }else if(stats.pending > 0){
      sub.textContent = `${stats.pending} assignment${stats.pending===1?'':'s'} still pending. Steady progress.`;
    }else if(stats.total > 0){
      sub.textContent = `Everything is marked complete. Well kept ledger.`;
    }else{
      sub.textContent = `Nothing logged yet — add your first assignment to begin.`;
    }

    // upcoming deadlines: next 5 non-completed, soonest first
    const upcoming = list
      .filter(a => !a.completed)
      .sort((a,b) => Utils.daysBetween(a.dueDate) - Utils.daysBetween(b.dueDate))
      .slice(0,5);

    const container = document.getElementById('upcomingList');
    container.innerHTML = upcoming.length
      ? upcoming.map(a => App.assignmentCardHtml(a)).join('')
      : `<p class="empty-note">No upcoming deadlines. Add an assignment to see it here.</p>`;
  }
};