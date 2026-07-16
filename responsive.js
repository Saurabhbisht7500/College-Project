/* =========================================================
   Responsive rules — injects the small-screen layout as CSS
   ========================================================= */

const responsiveRules = `
@media (max-width: 900px){
  .chart-row{ grid-template-columns: 1fr; }
  .stat-row{ grid-template-columns: repeat(2,1fr); }
}

@media (max-width: 780px){
  .ruler-nav{
    transform: translateX(-100%);
    transition: transform 220ms ease;
    box-shadow: 8px 0 24px rgba(0,0,0,0.15);
  }
  .ruler-nav.open{ transform: translateX(0); }

  .mobile-bar{
    display:flex; align-items:center; justify-content:space-between;
    position: sticky; top:0; z-index: 40;
    background: var(--paper-raised); border-bottom: 2px solid var(--border-hard);
    padding: 14px 18px;
  }
  .mobile-menu-btn{
    background:none; border: 1.5px solid var(--rule-line); border-radius: var(--radius);
    font-size: 18px; padding: 4px 10px; cursor:pointer; color: var(--ink);
  }

  .stage{ margin-left: 0; padding: 24px 18px 70px; }

  .mobile-nav-overlay.open{
    display:block; position: fixed; inset:0; background: rgba(0,0,0,0.35); z-index: 45;
  }

  .field-row{ grid-template-columns: 1fr; }
  .toolbar{ flex-direction:column; align-items:stretch; }
  .toolbar select, .toolbar .search-field{ width:100%; }
  .welcome-title{ font-size: 26px; }
  .stat-row{ grid-template-columns: repeat(2,1fr); gap: 10px; }
  .card-list{ grid-template-columns: 1fr; }
  .calendar-grid{ gap:3px; }
  .cal-cell{ min-height: 52px; padding: 4px; font-size: 10.5px; }
}

@media (max-width: 480px){
  .stat-row{ grid-template-columns: 1fr 1fr; }
  .stat-number{ font-size: 24px; }
  .welcome-title{ font-size: 22px; }
}`;

if (!document.getElementById('responsive-rules')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'responsive-rules';
  styleEl.textContent = responsiveRules;
  document.head.appendChild(styleEl);
}