const board = document.getElementById('board');
const boardView = document.getElementById('board_view');
const metricsView = document.getElementById('metrics_view');
const agentsEl = document.getElementById('agents');
const auditEl = document.getElementById('audit');
const statuses = ['backlog','todo','doing','review','done'];
let state = { tasks: [], agents: [], audit: [] };
let selectedTaskId = null;

const drawer = document.getElementById('drawer');
const dClose = document.getElementById('d_close');
const dSave = document.getElementById('d_save');
const dTitle = document.getElementById('d_task_title');
const dDesc = document.getElementById('d_task_desc');
const dStatus = document.getElementById('d_task_status');
const dPriority = document.getElementById('d_task_priority');
const dAssignee = document.getElementById('d_task_assignee');
const dAutoPick = document.getElementById('d_task_autopick');
const dHistory = document.getElementById('d_history');

const tabBoard = document.getElementById('tab_board');
const tabMetrics = document.getElementById('tab_metrics');
const statusChart = document.getElementById('status_chart');
const agentChart = document.getElementById('agent_chart');
const throughputEl = document.getElementById('throughput');

for (const s of statuses) {
  const opt = document.createElement('option');
  opt.value = s;
  opt.textContent = s[0].toUpperCase()+s.slice(1);
  dStatus.appendChild(opt);
}

async function api(path, options={}) {
  const res = await fetch(path, {headers:{'Content-Type':'application/json'}, ...options});
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function colTitle(s){ return s[0].toUpperCase()+s.slice(1); }

function taskCard(task){
  const assignee = state.agents.find(a => a.id === task.assigneeId);
  const el = document.createElement('div');
  el.className = 'task';
  el.draggable = true;
  el.dataset.id = task.id;
  el.innerHTML = `
    <div class="row"><strong>${escapeHtml(task.title)}</strong><button data-del="${task.id}">✕</button></div>
    <div class="meta">P${6-task.priority} · ${assignee ? escapeHtml(assignee.name) : 'Unassigned'} · ${task.autoPick ? 'Auto' : 'Manual'}</div>
    <div class="meta">${escapeHtml(task.description||'')}</div>
    <div class="row" style="margin-top:6px">
      <select data-assign="${task.id}">
        <option value="">Assign…</option>
        ${state.agents.map(a=>`<option value="${a.id}" ${a.id===task.assigneeId?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}
      </select>
      <span class="tag">${task.status}</span>
    </div>
  `;
  el.addEventListener('dragstart', e => e.dataTransfer.setData('text/task', task.id));
  el.querySelector('button').onclick = async (e) => { e.stopPropagation(); await api(`/api/tasks/${task.id}`, {method:'DELETE', body: JSON.stringify({actor:'user'})}); };
  el.querySelector('select').onchange = async (e) => {
    const assigneeId = e.target.value || null;
    await api(`/api/tasks/${task.id}`, {method:'PATCH', body: JSON.stringify({assigneeId, actor:'user'})});
  };
  el.ondblclick = () => openDrawer(task.id);
  return el;
}

function renderBoard(){
  board.innerHTML = '';
  for(const s of statuses){
    const col = document.createElement('div');
    col.className = 'col';
    col.dataset.status = s;
    const items = state.tasks.filter(t=>t.status===s).sort((a,b)=>b.priority-a.priority || a.createdAt.localeCompare(b.createdAt));
    col.innerHTML = `<h3>${colTitle(s)} (${items.length})</h3>`;
    for(const t of items) col.appendChild(taskCard(t));

    col.addEventListener('dragover', e=>{e.preventDefault(); col.classList.add('drop');});
    col.addEventListener('dragleave', ()=>col.classList.remove('drop'));
    col.addEventListener('drop', async e=>{
      e.preventDefault(); col.classList.remove('drop');
      const id = e.dataTransfer.getData('text/task');
      if(!id) return;
      await api(`/api/tasks/${id}`, {method:'PATCH', body: JSON.stringify({status:s, actor:'user'})});
    });

    board.appendChild(col);
  }
}

function drawBarChart(canvas, labels, values, color='#6b86ff') {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#0f1430';
  ctx.fillRect(0,0,w,h);
  const max = Math.max(1, ...values);
  const pad = 40;
  const bw = (w - pad*2) / labels.length * 0.7;
  labels.forEach((lb, i) => {
    const x = pad + i * ((w-pad*2)/labels.length) + 10;
    const vh = (h - pad*1.7) * (values[i] / max);
    const y = h - pad - vh;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, bw, vh);
    ctx.fillStyle = '#c7d4ff';
    ctx.font = '12px sans-serif';
    ctx.fillText(lb, x, h - 14);
    ctx.fillText(String(values[i]), x, y - 6);
  });
}

function renderMetrics() {
  const byStatus = statuses.map(s => state.tasks.filter(t => t.status===s).length);
  drawBarChart(statusChart, statuses.map(s=>s.slice(0,3)), byStatus, '#6d84ff');
  drawBarChart(agentChart, state.agents.map(a=>a.name.slice(0,8)), state.agents.map(a=>a.wip), '#59d1b4');

  const doneToday = state.audit.filter(a=>a.action==='status_change' && /completed/.test(a.summary)).length;
  const autoPicks = state.audit.filter(a=>a.action==='autopick').length;
  const backlog = state.tasks.filter(t=>t.status==='backlog').length;
  throughputEl.innerHTML = `Done events: <b>${doneToday}</b><br>Auto-picks: <b>${autoPicks}</b><br>Backlog size: <b>${backlog}</b>`;
}

function renderSide(){
  agentsEl.innerHTML = state.agents.map(a=>`<div class="agent"><strong>${escapeHtml(a.name)}</strong><div>${escapeHtml(a.role)}</div><div>WIP ${a.wip}/${a.capacity} · ${a.active?'active':'paused'}</div><div style="margin-top:6px"><button data-toggle="${a.id}">${a.active?'Pause':'Activate'}</button></div></div>`).join('');
  agentsEl.querySelectorAll('button[data-toggle]').forEach(btn=>{
    btn.onclick = async ()=>{
      const agent = state.agents.find(a=>a.id===btn.dataset.toggle);
      await api(`/api/agents/${agent.id}`, {method:'PATCH', body: JSON.stringify({active:!agent.active, actor:'user'})});
    };
  });

  auditEl.innerHTML = state.audit.slice(0,80).map(a=>`<div class="audit"><strong>${escapeHtml(a.action)}</strong> · ${escapeHtml(a.summary)}<br><span style="color:#97a7e4">${new Date(a.at).toLocaleTimeString()}</span></div>`).join('');
}

function render(){
  renderBoard();
  renderSide();
  renderMetrics();
  if (selectedTaskId && !state.tasks.some(t => t.id === selectedTaskId)) closeDrawer();
}

async function openDrawer(taskId){
  selectedTaskId = taskId;
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  document.getElementById('d_title').textContent = `Task: ${task.title}`;
  dTitle.value = task.title;
  dDesc.value = task.description || '';
  dStatus.value = task.status;
  dPriority.value = String(task.priority);
  dAutoPick.checked = !!task.autoPick;
  dAssignee.innerHTML = `<option value="">Unassigned</option>` + state.agents.map(a=>`<option value="${a.id}" ${a.id===task.assigneeId?'selected':''}>${escapeHtml(a.name)}</option>`).join('');
  const history = await api(`/api/tasks/${taskId}/history`);
  dHistory.innerHTML = history.map(h => `<div class="history-item"><strong>${escapeHtml(h.action)}</strong> · ${escapeHtml(h.summary)}<br><span style="color:#8da0e8">${new Date(h.at).toLocaleString()}</span></div>`).join('');
  drawer.classList.remove('hidden');
}
function closeDrawer(){ selectedTaskId = null; drawer.classList.add('hidden'); }

dClose.onclick = closeDrawer;
drawer.addEventListener('click', (e)=>{ if(e.target===drawer) closeDrawer(); });
dSave.onclick = async () => {
  if (!selectedTaskId) return;
  await api(`/api/tasks/${selectedTaskId}`, {method:'PATCH', body: JSON.stringify({
    title: dTitle.value,
    description: dDesc.value,
    status: dStatus.value,
    priority: Number(dPriority.value),
    assigneeId: dAssignee.value || null,
    autoPick: dAutoPick.checked,
    actor: 'user'
  })});
  closeDrawer();
};

document.getElementById('add').onclick = async ()=>{
  const title = document.getElementById('title').value.trim();
  if(!title) return;
  const description = document.getElementById('desc').value.trim();
  const priority = Number(document.getElementById('priority').value);
  await api('/api/tasks', {method:'POST', body: JSON.stringify({title, description, priority, actor:'user'})});
  document.getElementById('title').value='';
  document.getElementById('desc').value='';
};

document.getElementById('export_tasks').onclick = async () => {
  const data = await api('/api/export');
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `teamflow-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

document.getElementById('import_tasks').onchange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const parsed = JSON.parse(text);
  await api('/api/import', {method:'POST', body: JSON.stringify({tasks: parsed.tasks || [], actor:'user'})});
  e.target.value = '';
};

function showTab(name) {
  const isBoard = name === 'board';
  boardView.classList.toggle('hidden', !isBoard);
  metricsView.classList.toggle('hidden', isBoard);
  tabBoard.classList.toggle('active', isBoard);
  tabMetrics.classList.toggle('active', !isBoard);
}
tabBoard.onclick = () => showTab('board');
tabMetrics.onclick = () => showTab('metrics');


document.addEventListener('keydown', async (e) => {
  if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
    document.getElementById('title').focus();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    await document.getElementById('add').onclick();
  }
  if (e.key === 'Escape') closeDrawer();
});

function connectWs(){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}`);
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'state') {
      state = msg.data;
      render();
    }
  };
  ws.onclose = () => setTimeout(connectWs, 1500);
}

function escapeHtml(s=''){return s.replace(/[&<>\"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}

showTab('board');
connectWs();
api('/api/state').then(s=>{state=s;render();});
