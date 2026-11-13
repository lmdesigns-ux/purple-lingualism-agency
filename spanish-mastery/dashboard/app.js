(function () {
  'use strict';
  const data = window.SPANISH_MASTERY_DATA;
  const {dateLabel,todayKey,reviewStatus,reviewGroups} = window.DashboardLogic;
  const $ = (tag, className, text) => {
    const element = document.createElement(tag);
    if(className) element.className = className;
    if(text !== undefined) element.textContent = text;
    return element;
  };
  function link(label,href,className) {const a=$('a',className,label);a.href=href;return a;}
  function sourceList(ids=[]) {
    const box=$('div','sources');
    box.append($('span','source-label','From your records'));
    for(const id of ids) {const source=data.sources[id];if(source)box.append(link(source.label,source.href));}
    return box;
  }
  function disclosure(title,children,className='more-details') {
    const details=$('details',className);details.append($('summary','',title),...children);return details;
  }
  function badge(path,title,size='') {
    const frame=$('div','badge-image '+size), fallback=$('span','badge-fallback','Award image unavailable');
    if(path) {
      const img=$('img');img.alt=title+' badge';img.src=path;img.width=120;img.height=120;
      img.addEventListener('error',()=>{img.remove();frame.append(fallback);},{once:true});frame.append(img);
    } else frame.append(fallback);
    return frame;
  }
  function heading(number,title,description) {
    const h=$('div','section-heading'), text=$('div');
    text.append($('p','eyebrow','YOUR LEARNING JOURNEY'),$('h2','',title));
    if(description)text.append($('p','section-description',description));
    h.append(text,$('span','section-number',number));return h;
  }
  function reviewItem(review,today) {
    const item=$('li','review-item');
    item.append($('span','status review-status',reviewStatus(review,today)),$('strong','',review.title),$('span','review-date',dateLabel(review.date)));
    if(review.description)item.append($('p','',review.description));
    item.append(disclosure('Review source',[sourceList(review.sources)]));return item;
  }
  function renderToday(today) {
    const wrap=$('section','today-grid');wrap.id='today';wrap.setAttribute('aria-labelledby','today-heading');
    const primary=$('div','today-primary');const title=$('h2','','Today');title.id='today-heading';
    primary.append($('p','eyebrow','01 / A SMALL NEXT STEP'),title,$('h3','',data.recommendation.title),$('p','',data.recommendation.description),link('Open your practice plan ↗','#practice-plan','action-link'));
    const prompt=$('div','chat-prompt');prompt.append($('span','','Try this in our chat'),$('p','',data.recommendation.chatPrompt));primary.append(prompt);
    primary.append($('p','recommendation-date','Suggested '+dateLabel(data.recommendation.date)),disclosure('Why this next step?',[sourceList(data.recommendation.sources)]));
    const reviews=$('div','review-panel');reviews.append($('p','eyebrow','KEEP IT FRESH'),$('h3','','Your reviews'));
    const groups=reviewGroups(data.reviews,today), list=$('ul','review-list');
    if(groups.due.length){reviews.append($('p','review-intro',`${groups.due.length} review${groups.due.length===1?'':'s'} ready to revisit.`));for(const review of groups.due)list.append(reviewItem(review,today));}
    else reviews.append($('p','review-intro','No dated reviews due today.'));
    reviews.append(list); const upcomingList=$('ul','review-list');
    if(groups.upcoming.length){reviews.append($('p','next-review-label','Next upcoming review'));upcomingList.append(reviewItem(groups.upcoming[0],today));}
    if(!groups.upcoming.length)reviews.append($('p','review-intro','No upcoming dated review scheduled.'));
    reviews.append(upcomingList);
    const rest=groups.upcoming.slice(1).concat(groups.undated);
    if(rest.length){const later=$('ul','review-list');for(const review of rest)later.append(reviewItem(review,today));reviews.append(disclosure('More planned reviews',[later]));}
    reviews.append($('p','fine-print','Dates are suggestions, not deadlines. Reviews happen when you return; an unreviewed item is not a failure.'));
    wrap.append(primary,reviews);return wrap;
  }
  function renderPracticePlan() {
    const plan=data.practicePlan;
    const section=$('section','practice-plan');section.id='practice-plan';
    section.append($('p','eyebrow','YOUR NEXT CHALLENGE'),$('h2','',plan.title),$('p','',plan.description));
    const days=$('ol','plan-days');
    for(const day of plan.days){const item=$('li');item.append($('h3','',day.title),$('p','',day.description));days.append(item);}
    section.append(days);
    const words=$('ul');for(const word of plan.vocabulary){const item=$('li');const phrase=$('strong','',word.spanish);phrase.lang='es';item.append(phrase,document.createTextNode(' — '+word.meaning));words.append(item);}
    section.append(disclosure('Starter flashcard phrases',[words]));
    const script=$('p','forecast-script',plan.script);script.lang='es';
    section.append($('h3','','Your forecast frame'),script,$('p','',plan.goal),$('p','',plan.report),sourceList(plan.sources));
    return section;
  }
  function renderGoals() {
    const section=$('section','goals');section.setAttribute('aria-labelledby','goals-heading');const title=$('h2','','Your goals');title.id='goals-heading';
    section.append($('p','eyebrow','THE BIGGER PICTURE'),title);const list=$('ul');
    for(const goal of data.goals)list.append($('li','',goal));section.append(list,disclosure('Your learning preferences',[sourceList(['profile'])]));return section;
  }
  function renderFocus() {
    const section=$('section','focus-section');section.id='focus';section.append(heading('02','A little extra attention','Three small priorities, drawn from your practice and feedback.'));
    const grid=$('div','focus-grid');for(const [i,focus] of data.focusAreas.slice(0,3).entries()) {
      const card=$('article','focus-card');card.append($('span','focus-index',String(i+1).padStart(2,'0')),$('p','provenance',focus.label),$('h3','',focus.title),$('p','',focus.summary));
      const action=$('p','focus-action');action.append($('strong','','Next: '),document.createTextNode(focus.action));card.append(action);
      const content=focus.details.map(text=>$('p','',text));content.push(sourceList(focus.sources));card.append(disclosure('Examples & evidence',content));grid.append(card);
    }section.append(grid);return section;
  }
  function taskList(items) {
    const list=$('ul','task-list');for(const task of items){const item=$('li','task '+task.status);const text=$('div','task-text');
      text.append($('span','status',task.status==='earned'?'Earned':'Not yet recorded'),$('h5','',task.title),$('p','',task.description));
      if(task.studyMaterials?.length){
        const materials=$('div','study-materials');materials.append($('span','source-label','Study decks'));
        for(const material of task.studyMaterials){const a=link(material.label+' ↗',material.href);a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',material.label+' (opens in a new tab)');materials.append(a);}
        text.append(materials);
      }
      if(task.sources?.length)text.append(disclosure('Source',[sourceList(task.sources)]));
      if(task.badge)item.append(badge(task.badge,task.title,'small'));item.append(text);list.append(item);
    }return list;
  }
  function renderPrograms() {
    const section=$('section','programs');section.id='programs';section.append(heading('03','Where you are. What comes next.','Your program milestones, separate from practice and long-term recall.'));
    const program=$('article','program-card');const top=$('div','program-top');const title=$('div');title.append($('p','eyebrow','COMMUNITY PROGRAM'),$('h3','',data.program.title));top.append(title,$('span','status current','Current rank: '+data.program.currentRank));program.append(top);
    const target=data.program.levels.find(level=>level.title===data.program.targetRank);
    if(target?.core){const core=target.core.filter(t=>t.status==='earned').length;const retos=target.retos || [];const earnedRetos=retos.filter(t=>t.status==='earned').length;program.append($('p','program-overview','Working toward '+data.program.targetRank+' · '+core+' of '+target.core.length+' core challenges earned · '+earnedRetos+' of '+retos.length+' retos recorded as earned'));}
    const path=$('ol','rank-path');path.setAttribute('aria-label','Community rank path');
    for(const level of data.program.levels){const li=$('li',level.id==='huevo'?'current-rank':level.id==='polluelo'?'target-rank':'');li.append(link(level.title,'#level-'+level.id),$('small','',level.id==='huevo'?'You are here':level.id==='polluelo'?'Working toward':level.status==='Attained'?'Attained':level.status==='Not available'?'Future stage':'Earlier stage'));path.append(li);}program.append(path);
    const levels=$('div','levels');for(const level of data.program.levels){const details=$('details','level');details.id='level-'+level.id;details.open=false;const summary=$('summary');summary.append($('span','level-name',level.title),$('span','status '+(level.id==='polluelo'?'active':level.status.includes('attained')||level.status==='Attained'?'earned':''),level.status));details.append(summary);
      const body=$('div','level-body');if(level.badge)body.append(badge(level.badge,level.title,'level-badge'));body.append($('p','level-description',level.description));
      if(level.core){const earned=level.core.filter(t=>t.status==='earned').length;body.append($('h4','',`${earned} of ${level.core.length} core challenges recorded as earned`),taskList(level.core));}
      if(level.retos){const earned=level.retos.filter(t=>t.status==='earned').length;body.append($('h4','',`Retos · ${earned} of ${level.retos.length} recorded as earned`),taskList(level.retos));}
      body.append(sourceList(level.sources));details.append(body);levels.append(details);
    }program.append(levels,$('p','fine-print program-note','“Not yet recorded” means no completion is recorded here. Community awards do not by themselves measure lasting recall or automatic speaking. Future ranks are not CEFR levels.'));section.append(program);
    for(const other of data.otherPrograms){const card=$('article','other-program');const text=$('div');text.append($('h3','',other.title),$('p','',other.description),disclosure('Program records',[sourceList(other.sources)]));card.append(text,$('span','status',other.status));section.append(card);}return section;
  }
  function renderWins() {
    const section=$('section','wins');section.id='wins';section.append(heading('04','Worth celebrating.','A few recent milestones on your journey.'));
    const grid=$('div','wins-grid');for(const win of data.achievements){const card=$('article','win-card');card.append(badge(win.badge,win.title),$('span','status earned','Awarded achievement'),$('h3','',win.title),$('p','win-date','Reported '+dateLabel(win.reportDate)),$('p','',win.description),disclosure('Award & feedback sources',[sourceList(win.sources)]));grid.append(card);}section.append(grid);return section;
  }
  function openLevelHash(){if(location.hash.startsWith('#level-')){const element=document.getElementById(location.hash.slice(1));if(element?.tagName==='DETAILS')element.open=true;}}
  function render() {
    if(!data){document.getElementById('dashboard').textContent='The learning snapshot could not be loaded. Open Progress notes below to see your records.';return;}
    const today=todayKey();document.getElementById('updated').textContent='Updated through '+dateLabel(data.updatedThrough);
    const dashboard=document.getElementById('dashboard');dashboard.replaceChildren();dashboard.append(renderToday(today));if(data.practicePlan)dashboard.append(renderPracticePlan());
    const middle=$('div','direction-grid');middle.append(renderGoals());const direction=$('aside','direction-card');direction.append($('p','eyebrow','YOUR CURRENT CHAPTER'),$('h2','',data.program.currentRank+' → '+data.program.targetRank),$('p','',data.program.currentRank+' attained. '+data.program.targetRank+' in progress.'),$('strong','',data.achievements[0]?.title || 'Your next chapter'),$('p','',data.recommendation.title),link('See program progress ↗','#programs'));
    const practice=$('div','practice-links');
    for(const tool of data.practiceLinks || []){const a=link(tool.label,tool.url);a.target='_blank';a.rel='noopener noreferrer';practice.append(a);}
    if(practice.childNodes.length)direction.append(practice);
    middle.append(direction);
    dashboard.append(middle,renderFocus(),renderPrograms(),renderWins());openLevelHash();
  }
  render();window.addEventListener('hashchange',openLevelHash);
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a[href^="#level-"]');
    if(anchor){const level=document.getElementById(anchor.getAttribute('href').slice(1));if(level)level.open=true;}
  });
  // Refresh date labels when this local tab returns to the foreground or crosses a day.
  let lastDay=todayKey();
  function refreshDay(){const key=todayKey();if(key!==lastDay){lastDay=key;render();}}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDay();});setInterval(refreshDay,60000);
})();
