/* Shared date logic; classic script so file:// works without a server. */
(function (root) {
  'use strict';
  function todayKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const get = key => parts.find(p => p.type === key).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function validDate(value) {
    if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value+'T12:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
  }
  function dateLabel(value) {
    if(!validDate(value)) return 'Date not set';
    return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'long',day:'numeric',year:'numeric'}).format(new Date(value+'T12:00:00Z'));
  }
  function reviewStatus(review, today = todayKey()) {
    if(review.completed) return 'Completed';
    if(!validDate(review.date)) return 'Date not set';
    return review.date < today ? 'Due for review' : review.date === today ? 'Due today' : 'Upcoming';
  }
  function reviewGroups(reviews, today = todayKey()) {
    const sorted = [...reviews].sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999'));
    return {
      due: sorted.filter(r=>['Due for review','Due today'].includes(reviewStatus(r,today))),
      upcoming: sorted.filter(r=>reviewStatus(r,today)==='Upcoming'),
      undated: sorted.filter(r=>reviewStatus(r,today)==='Date not set')
    };
  }
  const api = {todayKey, validDate, dateLabel, reviewStatus, reviewGroups};
  root.DashboardLogic = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
