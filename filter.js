/* =========================================================
   filter.js — search / filter / sort for the Assignments view
   ========================================================= */

const Filter = {
  populateSubjects(list){
    const select = document.getElementById('filterSubject');
    const current = select.value;
    const subjects = [...new Set(list.map(a => a.subject).filter(Boolean))].sort();
    select.innerHTML = '<option value="">All Subjects</option>' +
      subjects.map(s => `<option value="${Utils.escapeHtml(s)}">${Utils.escapeHtml(s)}</option>`).join('');
    if(subjects.includes(current)) select.value = current;
  },

  apply(list){
    const search = document.getElementById('searchInput').value.trim().toLowerCase();
    const subject = document.getElementById('filterSubject').value;
    const priority = document.getElementById('filterPriority').value;
    const status = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;

    let result = list.filter(a => {
      if(search && !a.title.toLowerCase().includes(search)) return false;
      if(subject && a.subject !== subject) return false;
      if(priority && a.priority !== priority) return false;
      if(status && Utils.getStatus(a) !== status) return false;
      return true;
    });

    const priorityWeight = { High: 0, Medium: 1, Low: 2 };

    result.sort((a,b) => {
      switch(sortBy){
        case 'dueDesc':
          return Utils.parseDate(b.dueDate) - Utils.parseDate(a.dueDate);
        case 'priority':
          return priorityWeight[a.priority] - priorityWeight[b.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'dueAsc':
        default:
          return Utils.parseDate(a.dueDate) - Utils.parseDate(b.dueDate);
      }
    });

    return result;
  }
};