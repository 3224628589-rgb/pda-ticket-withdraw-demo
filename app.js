const initialTickets = [
  { id: 'GD10000001', status: 10, store: 'A', title: '实物与美团资料不一致', order: 'CG10000001', goods: '80000001', description: '美团的是处方药，实物是 OTC，帮忙看一下，急着入库上架谢谢', reporter: '店员甲', time: '2026-10-29 10:25:21', image: './assets/药盒.jpg' },
  { id: 'GD10000002', status: 20, store: 'A', title: '采购单商品信息异常', order: 'CG10000002', goods: '80000002', description: '采购单商品与实物信息不一致，请协助处理', reporter: '店员乙', time: '2026-10-29 09:40:12', image: './assets/药盒.jpg' },
  { id: 'GD10000003', status: 30, store: 'A', title: '采购单缺失', order: 'CG10000003', goods: '', description: '到货后未查询到对应采购单', reporter: '店员丙', time: '2026-10-28 16:05:08', image: './assets/药盒.jpg' }
];

const app = document.getElementById('app');
const state = { tickets: structuredClone(initialTickets), screen: 'list', tab: 'processing', selected: null, modal: false, query: '', currentStore: 'A', shownStatus: null, toast: '' };
const labels = { onsite: '待完成', processing: '处理中', complete: '已完结' };
let toastTimer;

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function visible(ticket) { return ticket.status !== 50 && ticket.store === state.currentStore; }
function inTab(ticket, tab) { return tab === 'onsite' ? ticket.status === 30 : tab === 'complete' ? ticket.status === 40 : ticket.status === 10 || ticket.status === 20; }
function currentTicket() { return state.tickets.find(ticket => ticket.id === state.selected); }
function tabCount(tab) { return state.tickets.filter(ticket => visible(ticket) && inTab(ticket, tab)).length; }
function showToast(message) { state.toast = message; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { state.toast = ''; render(); }, 3000); }

function listView() {
  const query = state.query.trim().toLowerCase();
  const rows = state.tickets.filter(ticket => visible(ticket) && inTab(ticket, state.tab) && (!query || [ticket.id, ticket.title, ticket.order, ticket.description].some(text => text.toLowerCase().includes(query))));
  return `<div class="screen">
    <header class="nav"><span></span><h2>工单协作</h2><span class="nav-spacer"></span></header>
    <div class="tabs" role="tablist" aria-label="工单状态">${Object.entries(labels).map(([key,label]) => `<button type="button" role="tab" aria-selected="${state.tab === key}" data-tab="${key}" class="tab ${state.tab === key ? 'active' : ''}">${label}${tabCount(key) ? `<span class="tab-count">${tabCount(key)}</span>` : ''}</button>`).join('')}</div>
    <div class="list-scroll"><div class="search-wrap"><div class="search-shell"><input id="ticket-search" class="search" aria-label="搜索工单" placeholder="工单编号/异常类型/提报内容" value="${escapeHtml(state.query)}"></div></div>
    <div class="ticket-list">${rows.length ? rows.map(ticket => `<button type="button" class="ticket-card" data-open="${ticket.id}"><span><p class="ticket-card-title">${escapeHtml(ticket.title)}</p><p class="ticket-card-meta">工单编号：${ticket.id}</p><span class="ticket-card-description">${escapeHtml(ticket.description)}</span><span class="ticket-card-foot">${escapeHtml(ticket.reporter)}于${ticket.time.slice(0,10)}提报</span></span><img src="${ticket.image}" alt="提报照片"></button>`).join('') : `<div class="empty">当前没有${labels[state.tab]}的工单</div>`}</div></div>
  </div>`;
}

function detailView() {
  const ticket = currentTicket();
  if (!ticket || ticket.status === 50 || ticket.store !== state.currentStore) return unavailableView();
  const canWithdraw = state.shownStatus === 10;
  return `<div class="screen"><header class="nav"><button type="button" class="nav-back" id="back-list" aria-label="返回工单列表">‹</button><h2>工单详情</h2>${canWithdraw ? `<button type="button" class="nav-action" id="withdraw-ticket">撤回工单</button>` : `<span class="nav-spacer"></span>`}</header>
    <div class="detail-scroll"><div class="summary-card"><div class="summary-top"><strong>${escapeHtml(ticket.title)}</strong><span class="status-label">${state.shownStatus === 10 ? '待接单' : state.shownStatus === 20 ? '处理中' : '待现场完成'}</span></div><div class="summary-meta">工单编号：${ticket.id}<br>采购单号：${ticket.order}${ticket.goods ? `<br>商品编码：${ticket.goods}` : ''}</div></div>
    <div class="timeline-card"><div class="timeline-head"><strong>提报异常</strong><time>${ticket.time}</time></div><p>${escapeHtml(ticket.description)}</p><div class="photo-strip"><img src="${ticket.image}" alt="提报照片一"><img src="${ticket.image}" alt="提报照片二"></div></div>
    ${ticket.status === 20 ? `<div class="notice-card"><strong>接单</strong>责任人已接单，工单正在处理中</div>` : ''}
    ${ticket.status === 30 ? `<div class="notice-card"><strong>下发任务</strong>等待现场完成</div>` : ''}</div></div>`;
}

function unavailableView() { return `<div class="screen"><header class="nav"><button type="button" class="nav-back" id="back-list" aria-label="返回工单列表">‹</button><h2>工单详情</h2><span class="nav-spacer"></span></header><div class="unavailable"><div class="icon" aria-hidden="true">×</div><h3>该工单已撤回</h3><p>这张工单已失效，无法查看或继续处理。</p><button type="button" id="return-list">返回工单列表</button></div></div>`; }
function modalView() { return `<div class="shade"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h3 id="confirm-title">确认撤回工单</h3><p>撤回后，该工单将从 PC 和 PDA 工单列表中移除，且无法恢复。确定撤回吗？</p><div class="modal-actions"><button type="button" class="cancel" id="cancel-withdraw">取消</button><button type="button" class="confirm" id="confirm-withdraw">确定撤回</button></div></div></div>`; }

function render() {
  app.innerHTML = (state.screen === 'list' ? listView() : detailView()) + (state.modal ? modalView() : '') + (state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : '');
  document.getElementById('open-old-link').disabled = state.tickets[0].status !== 50;
  if (state.screen === 'list') document.getElementById('ticket-search')?.addEventListener('input', event => { state.query = event.target.value; const pos = event.target.selectionStart; render(); const input = document.getElementById('ticket-search'); input.focus(); input.setSelectionRange(pos,pos); });
}

function reset() { state.tickets = structuredClone(initialTickets); state.screen = 'list'; state.tab = 'processing'; state.selected = null; state.modal = false; state.query = ''; state.currentStore = 'A'; state.shownStatus = null; state.toast = ''; history.replaceState(null, '', location.pathname + location.search); render(); }
function backToList() { state.screen = 'list'; state.selected = null; state.shownStatus = null; state.modal = false; history.replaceState(null, '', location.pathname + location.search); render(); }
function openTicket(id) { state.selected = id; state.screen = 'detail'; state.shownStatus = currentTicket()?.status ?? null; history.replaceState(null, '', `#ticket=${encodeURIComponent(id)}`); render(); }
function confirmWithdraw() {
  const ticket = currentTicket(); state.modal = false;
  if (!ticket || ticket.store !== state.currentStore) { showToast('无权撤回该工单'); return; }
  if (ticket.status !== 10) { state.shownStatus = ticket.status; showToast('责任人已接单，无法撤回'); return; }
  ticket.status = 50; state.shownStatus = 50; backToList(); showToast('工单已撤回');
}

app.addEventListener('click', event => {
  const target = event.target.closest('button'); if (!target) return;
  if (target.dataset.tab) { state.tab = target.dataset.tab; render(); }
  else if (target.dataset.open) openTicket(target.dataset.open);
  else if (target.id === 'back-list' || target.id === 'return-list') backToList();
  else if (target.id === 'withdraw-ticket') { state.modal = true; render(); document.getElementById('cancel-withdraw')?.focus(); }
  else if (target.id === 'cancel-withdraw') { state.modal = false; render(); document.getElementById('withdraw-ticket')?.focus(); }
  else if (target.id === 'confirm-withdraw') confirmWithdraw();
});
document.getElementById('reset-demo').addEventListener('click', reset);
document.getElementById('open-old-link').addEventListener('click', () => openTicket('GD10000001'));
document.getElementById('simulate-accept').addEventListener('click', () => {
  const ticket = state.tickets.find(item => item.id === 'GD10000001');
  if (ticket.status !== 10) { showToast('请先重置演示'); return; }
  if (state.screen !== 'detail' || state.selected !== ticket.id) { showToast('请先打开第一张工单详情'); return; }
  ticket.status = 20; showToast('模拟：责任人已接单，请继续点撤回');
});
window.addEventListener('hashchange', () => { const match = location.hash.match(/^#ticket=(.+)$/); if (match) openTicket(decodeURIComponent(match[1])); else backToList(); });
const initialMatch = location.hash.match(/^#ticket=(.+)$/);
if (initialMatch) { state.selected = decodeURIComponent(initialMatch[1]); state.screen = 'detail'; state.shownStatus = currentTicket()?.status ?? null; }
render();
