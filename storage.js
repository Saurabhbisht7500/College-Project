/* =========================================================
   storage.js — persistence layer
   All reads/writes to localStorage go through this file.
   Assignment shape:
   {
     id: string,
     title, subject, teacher, dueDate (YYYY-MM-DD),
     priority: 'High'|'Medium'|'Low',
     description, attachmentName,
     completed: boolean,
     createdAt: ISO timestamp
   }
   ========================================================= */

const STORAGE_KEY = 'ledger_assignments_v1';
const THEME_KEY = 'ledger_theme_v1';

const Storage = {
  _memory: [], // in-memory fallback if localStorage is unavailable

  _available(){
    try{
      const t = '__ledger_test__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return true;
    }catch(e){
      return false;
    }
  },

  getAll(){
    if(this._available()){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      }catch(e){
        console.error('Ledger: failed to read storage', e);
        return [];
      }
    }
    return this._memory;
  },

  saveAll(list){
    if(this._available()){
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }catch(e){
        console.error('Ledger: failed to write storage', e);
      }
    }else{
      this._memory = list;
    }
  },

  add(assignment){
    const list = this.getAll();
    assignment.id = 'a_' + Date.now() + '_' + Math.floor(Math.random()*10000);
    assignment.createdAt = new Date().toISOString();
    if(assignment.completed === undefined) assignment.completed = false;
    list.push(assignment);
    this.saveAll(list);
    return assignment;
  },

  update(id, patch){
    const list = this.getAll();
    const idx = list.findIndex(a => a.id === id);
    if(idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    this.saveAll(list);
    return list[idx];
  },

  delete(id){
    const list = this.getAll().filter(a => a.id !== id);
    this.saveAll(list);
  },

  toggleComplete(id){
    const list = this.getAll();
    const idx = list.findIndex(a => a.id === id);
    if(idx === -1) return null;
    list[idx].completed = !list[idx].completed;
    this.saveAll(list);
    return list[idx];
  },

  getTheme(){
    if(this._available()){
      return localStorage.getItem(THEME_KEY) || 'light';
    }
    return 'light';
  },

  setTheme(theme){
    if(this._available()){
      localStorage.setItem(THEME_KEY, theme);
    }
  }
};