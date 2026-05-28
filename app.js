// State
let mode='year', selYear=2017, selTopic='AL';
let session=[]; // array of question objects for this test
let answers={}; // idx -> chosen letter
let curIdx=0;
let totalSecs=0, remainSecs=0, timerInterval=null;
let startTime=null, endTime=null;

// ── Setup init ────────────────────────────────────────────────
(function initSetup(){
  const years=[...new Set(ALL_Q.map(q=>q.Problem_ID.split('-')[1]).filter(y=>!isNaN(y)))].sort();
  const yearDiv=document.getElementById('year-opts');
  years.forEach(y=>{
    const b=document.createElement('button');
    b.className='opt-btn'+(y==2017?' sel':'');
    b.textContent=y;
    b.onclick=()=>{selYear=parseInt(y);yearDiv.querySelectorAll('.opt-btn').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')};
    yearDiv.appendChild(b);
    if(y==2017) selYear=2017;
  });

  const topics=[...new Set(ALL_Q.map(q=>q.Topic))].sort();
  const topicDiv=document.getElementById('topic-opts');
  topics.forEach((t,i)=>{
    const b=document.createElement('button');
    b.className='opt-btn topic-btn'+(i==0?' sel':'');
    b.innerHTML=`${TOPIC_LABELS[t]||t}<small>${t}</small>`;
    b.onclick=()=>{selTopic=t;topicDiv.querySelectorAll('.opt-btn').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')};
    topicDiv.appendChild(b);
    if(i==0) selTopic=t;
  });
})();

function setMode(m){
  mode=m;
  document.querySelectorAll('.tab-btn').forEach((b,i)=>b.classList.toggle('active',['year','topic','random'][i]===m));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+m).classList.add('active');
}

function adjCount(d){
  const el=document.getElementById('rand-count');
  el.value=Math.min(244,Math.max(5,parseInt(el.value)+d));
}

function startTest(){
  const mins=parseInt(document.getElementById('time-input').value)||60;
  totalSecs=mins*60; remainSecs=totalSecs;

  if(mode==='year'){
    session=ALL_Q.filter(q=>q.Problem_ID.startsWith('PCA-'+selYear+'-'));
  } else if(mode==='topic'){
    session=ALL_Q.filter(q=>q.Topic===selTopic);
  } else {
    const n=Math.min(244,Math.max(5,parseInt(document.getElementById('rand-count').value)||30));
    const pool=[...ALL_Q];
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    session=pool.slice(0,n);
  }

  if(!session.length){alert('No questions found for that selection.');return;}
  answers={};curIdx=0;
  startTime=Date.now();
  buildQGrid();
  showPage('pg-test');
  renderQuestion();
  startTimer();
}

// ── Timer ─────────────────────────────────────────────────────
function startTimer(){
  const nav=document.getElementById('timer-nav');
  nav.style.display='block';
  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    remainSecs--;
    updateTimerDisplay();
    if(remainSecs<=0){clearInterval(timerInterval);finishTest();}
  },1000);
  updateTimerDisplay();
}

function updateTimerDisplay(){
  const nav=document.getElementById('timer-nav');
  const m=Math.floor(remainSecs/60),s=remainSecs%60;
  nav.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  nav.className=remainSecs<=60?'danger':remainSecs<=300?'warn':'';
}

// ── Test rendering ────────────────────────────────────────────
function buildQGrid(){
  const grid=document.getElementById('q-grid');
  grid.innerHTML='';
  session.forEach((_,i)=>{
    const d=document.createElement('div');
    d.className='q-dot';d.id='qdot-'+i;d.textContent=i+1;
    d.onclick=()=>goTo(i);
    grid.appendChild(d);
  });
}

function renderQuestion(){
  const q=session[curIdx];
  const total=session.length;
  document.getElementById('prog-text').textContent=`Question ${curIdx+1} of ${total}`;
  document.getElementById('prog-bar').style.width=`${((curIdx+1)/total*100).toFixed(1)}%`;
  document.getElementById('q-topic').textContent=TOPIC_LABELS[q.Topic]||q.Topic;
  document.getElementById('q-id').textContent=q.Problem_ID;

  // Image
  const img=document.getElementById('q-img');
  const wrap=document.getElementById('img-wrap');
  img.style.display='block';
  const miss=wrap.querySelector('.img-missing');
  if(miss) miss.remove();
  img.src='./questions/'+q.Problem_ID+'.jpg';
  img.alt=q.Problem_ID;

  // Choices
  const grid=document.getElementById('choices-grid');
  grid.innerHTML='';
  ['a','b','c','d'].forEach(c=>{
    const div=document.createElement('div');
    div.className='choice'+(answers[curIdx]===c?' sel':'');
    div.textContent=c.toUpperCase();
    div.onclick=()=>selectAnswer(c);
    grid.appendChild(div);
  });

  // Prev/Next
  document.getElementById('btn-prev').style.visibility=curIdx===0?'hidden':'visible';
  const nextBtn=document.getElementById('btn-next');
  if(curIdx===total-1){nextBtn.textContent='Submit →';nextBtn.onclick=confirmFinish;}
  else{nextBtn.textContent='Next →';nextBtn.onclick=()=>navigate(1);}

  // Q-grid dots
  document.querySelectorAll('.q-dot').forEach((d,i)=>{
    d.className='q-dot'+(i===curIdx?' cur':answers[i]?' ans':'');
  });
}

function selectAnswer(c){
  answers[curIdx]=c;
  document.querySelectorAll('.choice').forEach((el,i)=>el.classList.toggle('sel',['a','b','c','d'][i]===c));
  const dot=document.getElementById('qdot-'+curIdx);
  if(dot&&!dot.classList.contains('cur')) dot.classList.add('ans');
}

function showImgMissing(){
  const img=document.getElementById('q-img');
  const wrap=document.getElementById('img-wrap');
  img.style.display='none';
  if(!wrap.querySelector('.img-missing')){
    const d=document.createElement('div');
    d.className='img-missing';
    d.innerHTML=`Image not found<br><code>${session[curIdx].Problem_ID}.jpg</code><br><small>Place JPEGs inside the /questions folder</small>`;
    wrap.appendChild(d);
  }
}

function navigate(dir){
  const next=curIdx+dir;
  if(next>=0&&next<session.length){curIdx=next;renderQuestion();}
}

function goTo(i){curIdx=i;renderQuestion();}

function confirmFinish(){
  const answered=Object.keys(answers).length;
  const unanswered=session.length-answered;
  let msg=`Answered: ${answered}/${session.length}`;
  if(unanswered>0) msg+=`\n${unanswered} question(s) unanswered (will be marked incorrect).`;
  msg+='\n\nSubmit test?';
  if(confirm(msg)) finishTest();
}

function finishTest(){
  clearInterval(timerInterval);
  endTime=Date.now();
  showResults();
  showPage('pg-results');
}

// ── Results ───────────────────────────────────────────────────
function showResults(){
  const total=session.length;
  let correct=0;
  const topicStats={};

  session.forEach((q,i)=>{
    const chosen=(answers[i]||'').toLowerCase();
    const isCorrect=chosen===q.Answer.toLowerCase();
    if(isCorrect) correct++;
    const t=q.Topic;
    if(!topicStats[t]) topicStats[t]={correct:0,total:0};
    topicStats[t].total++;
    if(isCorrect) topicStats[t].correct++;
  });

  document.getElementById('res-score').textContent=correct;
  document.getElementById('res-of').textContent=`/ ${total}`;
  document.getElementById('res-pct').textContent=Math.round(correct/total*100)+'%';

  if(startTime&&endTime){
    const secs=Math.round((endTime-startTime)/1000);
    document.getElementById('res-dur').textContent=`Time taken: ${Math.floor(secs/60)}m ${secs%60}s`;
  }

  // Topic breakdown
  const bd=document.getElementById('topic-breakdown');
  bd.innerHTML='';
  Object.entries(topicStats).sort((a,b)=>b[1].correct/b[1].total-a[1].correct/a[1].total).forEach(([code,s])=>{
    const pct=Math.round(s.correct/s.total*100);
    bd.innerHTML+=`<div class="topic-row">
      <div class="t-name">${TOPIC_LABELS[code]||code}</div>
      <div class="t-bar-w"><div class="t-bar" style="width:${pct}%"></div></div>
      <div class="t-score">${s.correct}/${s.total} (${pct}%)</div>
    </div>`;
  });

  // Review table
  const tbody=document.getElementById('review-body');
  tbody.innerHTML='';
  session.forEach((q,i)=>{
    const chosen=(answers[i]||'').toLowerCase();
    const correct_ans=q.Answer.toLowerCase();
    const skipped=!chosen;
    const isOk=chosen===correct_ans;
    let rowClass=skipped?'row-skip':isOk?'row-ok':'row-bad';
    let pill=skipped?'<span class="pill pill-skip">Skipped</span>':isOk?'<span class="pill pill-ok">✓ Correct</span>':'<span class="pill pill-bad">✗ Wrong</span>';
    tbody.innerHTML+=`<tr class="${rowClass}">
      <td>${i+1}</td>
      <td>${q.Problem_ID}</td>
      <td>${TOPIC_LABELS[q.Topic]||q.Topic}</td>
      <td class="ans-cell ${!skipped&&!isOk?'wro':''}">${skipped?'—':chosen.toUpperCase()}</td>
      <td class="ans-cell cor">${correct_ans.toUpperCase()}</td>
      <td>${pill}</td>
    </tr>`;
  });

  document.getElementById('timer-nav').style.display='none';
}

function goSetup(){
  showPage('pg-setup');
  document.getElementById('timer-nav').style.display='none';
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}