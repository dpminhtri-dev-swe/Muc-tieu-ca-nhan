(function () {
  const STORAGE_KEY = 'goal-tracker-state-v1';

  function normalizeState(value) {
    if (!value || !Array.isArray(value.goals)) return { goals: [] };
    return {
      goals: value.goals
        .filter((goal) => goal && typeof goal.title === 'string' && goal.title.trim())
        .map((goal) => ({
          id: String(goal.id || createId()),
          title: goal.title.trim(),
          description: typeof goal.description === 'string' ? goal.description : '',
          type: goal.type === 'long' ? 'long' : 'short',
          dueDate: typeof goal.dueDate === 'string' ? goal.dueDate : '',
          priority: ['high', 'medium', 'low'].includes(goal.priority) ? goal.priority : 'medium',
          status: goal.status === 'completed' ? 'completed' : 'active',
          children: normalizeChildren(goal),
          createdAt: goal.createdAt || new Date().toISOString(),
          updatedAt: goal.updatedAt || new Date().toISOString(),
        })),
    };
  }

  function calculateProgress(children) {
    if (!Array.isArray(children) || children.length === 0) return 0;
    return Math.round((children.filter((child) => child.completed || child.status === 'completed').length / children.length) * 100);
  }

  function normalizeChildren(goal) {
    const source = Array.isArray(goal.children) ? goal.children : Array.isArray(goal.steps) ? goal.steps : [];
    return source
      .filter((child) => child && typeof child.title === 'string' && child.title.trim())
      .map((child) => ({
        id: String(child.id || createId()),
        title: child.title.trim(),
        status: child.status === 'completed' || child.completed ? 'completed' : 'active',
      }));
  }

  function isOverdue(goal, today = new Date().toISOString().slice(0, 10)) {
    return Boolean(goal && goal.status !== 'completed' && goal.dueDate && goal.dueDate < today);
  }

  function validateImport(value) {
    if (!value || !Array.isArray(value.goals)) return { valid: false, reason: 'Tệp không có danh sách mục tiêu hợp lệ.' };
    const valid = value.goals.every((goal) => goal && typeof goal.title === 'string' && goal.title.trim());
    return valid ? { valid: true } : { valid: false, reason: 'Một hoặc nhiều mục tiêu bị thiếu tên.' };
  }

  function createId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `goal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const core = { normalizeState, calculateProgress, isOverdue, validateImport };
  if (typeof globalThis !== 'undefined') globalThis.GoalTrackerCore = core;

  if (typeof document === 'undefined') return;

  let state = loadState();
  let editingGoalId = null;
  let selectedGoalId = null;

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    goalForm: $('#goal-form'),
    title: $('#goal-title'),
    description: $('#goal-description'),
    type: $('#goal-type'),
    dueDate: $('#goal-due-date'),
    priority: $('#goal-priority'),
    goalList: $('#goal-list'),
    emptyState: $('#empty-state'),
    filterStatus: $('#filter-status'),
    filterType: $('#filter-type'),
    filterPriority: $('#filter-priority'),
    search: $('#goal-search'),
    todayList: $('#today-list'),
    todayEmpty: $('#today-empty'),
    detailPanel: $('#detail-panel'),
    detailEmpty: $('#detail-empty'),
    detailContent: $('#detail-content'),
    exportData: $('#export-data'),
    importData: $('#import-data'),
    importFile: $('#import-file'),
    clearData: $('#clear-data'),
    toast: $('#toast'),
    goalCount: $('#goal-count'),
    progressValue: $('#progress-value'),
    progressLabel: $('#progress-label'),
    activeCount: $('#active-count'),
    completedCount: $('#completed-count'),
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeState(raw ? JSON.parse(raw) : { goals: [] });
    } catch {
      return { goals: [] };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDate(date) {
    if (!date) return 'Chưa đặt hạn';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
  }

  function getStatus(goal) {
    if (goal.status === 'completed') return { label: 'Đã xong', className: 'done' };
    if (isOverdue(goal)) return { label: 'Quá hạn', className: 'overdue' };
    return { label: 'Đang làm', className: 'active' };
  }

  function getVisibleGoals() {
    const status = elements.filterStatus.value;
    const type = elements.filterType.value;
    const priority = elements.filterPriority.value;
    const search = elements.search.value.trim().toLowerCase();
    return state.goals.filter((goal) => {
      const currentStatus = goal.status === 'completed' ? 'completed' : isOverdue(goal) ? 'overdue' : 'active';
      return (!status || status === currentStatus)
        && (!type || goal.type === type)
        && (!priority || goal.priority === priority)
        && (!search || `${goal.title} ${goal.description}`.toLowerCase().includes(search));
    });
  }

  function render() {
    renderSummary();
    renderToday();
    renderGoals();
    renderDetails();
  }

  function renderSummary() {
    const total = state.goals.length;
    const completed = state.goals.filter((goal) => goal.status === 'completed').length;
    const active = total - completed;
    const overall = total ? Math.round(state.goals.reduce((sum, goal) => sum + calculateProgress(goal.children), 0) / total) : 0;
    elements.goalCount.textContent = total;
    const countCopy = document.querySelector('#goal-count-copy');
    if (countCopy) countCopy.textContent = total;
    elements.activeCount.textContent = active;
    elements.completedCount.textContent = completed;
    elements.progressValue.style.width = `${overall}%`;
    elements.progressLabel.textContent = `${overall}% tổng tiến độ`;
  }

  function renderToday() {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = state.goals
      .filter((goal) => goal.status !== 'completed' && (!goal.dueDate || goal.dueDate <= today || goal.dueDate <= addDays(today, 7)))
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
      .slice(0, 3);
    elements.todayList.innerHTML = upcoming.map((goal) => miniGoalMarkup(goal)).join('');
    elements.todayEmpty.hidden = upcoming.length > 0;
    elements.todayList.querySelectorAll('[data-select-goal]').forEach((button) => button.addEventListener('click', () => selectGoal(button.dataset.selectGoal)));
  }

  function addDays(date, days) {
    const result = new Date(`${date}T00:00:00`);
    result.setDate(result.getDate() + days);
    return result.toISOString().slice(0, 10);
  }

  function miniGoalMarkup(goal) {
    const progress = calculateProgress(goal.children);
    return `<button class="today-item" data-select-goal="${escapeHtml(goal.id)}">
      <span class="today-dot ${goal.priority}"></span>
      <span class="today-item-main"><strong>${escapeHtml(goal.title)}</strong><small>${goal.dueDate ? `Hạn ${formatDate(goal.dueDate)}` : 'Chưa đặt hạn'}</small></span>
      <span class="today-percent">${progress}%</span>
    </button>`;
  }

  function renderGoals() {
    const goals = getVisibleGoals();
    elements.goalList.innerHTML = goals.map(goalCardMarkup).join('');
    elements.emptyState.hidden = goals.length > 0;
    elements.goalList.querySelectorAll('[data-select-goal]').forEach((button) => button.addEventListener('click', () => selectGoal(button.dataset.selectGoal)));
    elements.goalList.querySelectorAll('[data-complete-goal]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleGoalStatus(button.dataset.completeGoal);
    }));
  }

  function goalCardMarkup(goal) {
    const progress = calculateProgress(goal.children);
    const status = getStatus(goal);
    const typeLabel = goal.type === 'long' ? 'Dài hạn' : 'Ngắn hạn';
    const priorityLabel = { high: 'Cao', medium: 'Vừa', low: 'Thấp' }[goal.priority];
    return `<article class="goal-card ${selectedGoalId === goal.id ? 'selected' : ''}" data-select-goal="${escapeHtml(goal.id)}">
      <div class="goal-card-top"><span class="eyebrow ${goal.type}">${typeLabel}</span><span class="status-pill ${status.className}">${status.label}</span></div>
      <h3>${escapeHtml(goal.title)}</h3>
      <p>${escapeHtml(goal.description || 'Chưa có mô tả')}</p>
      <div class="goal-meta"><span><i class="icon">◷</i>${formatDate(goal.dueDate)}</span><span><i class="icon">↗</i>Ưu tiên ${priorityLabel}</span></div>
      <div class="card-progress"><div class="progress-track"><span style="width:${progress}%"></span></div><strong>${progress}%</strong></div>
      <div class="card-footer"><span>${goal.children.filter((child) => child.status === 'completed').length}/${goal.children.length || 0} mục tiêu nhỏ</span><button class="complete-button" data-complete-goal="${escapeHtml(goal.id)}" title="Đánh dấu hoàn thành">${goal.status === 'completed' ? 'Mở lại' : 'Hoàn thành'}</button></div>
    </article>`;
  }

  function renderDetails() {
    const goal = state.goals.find((item) => item.id === selectedGoalId);
    elements.detailEmpty.hidden = Boolean(goal);
    elements.detailContent.hidden = !goal;
    if (!goal) return;
    const progress = calculateProgress(goal.children);
    const status = getStatus(goal);
    elements.detailContent.innerHTML = `<div class="detail-heading"><div><span class="eyebrow ${goal.type}">${goal.type === 'long' ? 'Mục tiêu dài hạn' : 'Mục tiêu ngắn hạn'}</span><h2>${escapeHtml(goal.title)}</h2></div><button class="ghost-button" id="edit-selected">Sửa</button></div>
      <p class="detail-description">${escapeHtml(goal.description || 'Bạn chưa thêm mô tả cho mục tiêu này.')}</p>
      <div class="detail-stats"><span><small>Trạng thái</small><strong>${status.label}</strong></span><span><small>Hạn hoàn thành</small><strong>${formatDate(goal.dueDate)}</strong></span><span><small>Tiến độ</small><strong>${progress}%</strong></span></div>
      <div class="detail-progress"><div class="progress-track"><span style="width:${progress}%"></span></div></div>
      <div class="steps-heading"><div><span class="section-kicker">MỤC TIÊU NHỎ</span><h3>Xây từ những điều nhỏ</h3></div><span>${goal.children.length} mục tiêu nhỏ</span></div>
      <form class="step-form" id="step-form"><input id="step-title" aria-label="Tên mục tiêu nhỏ" placeholder="Thêm một mục tiêu nhỏ…" required><button class="primary-button" type="submit">Thêm</button></form>
      <div class="step-list">${goal.children.length ? goal.children.map(stepMarkup).join('') : '<p class="soft-empty">Chưa có mục tiêu nhỏ. Hãy thêm điều đầu tiên.</p>'}</div>`;
    $('#edit-selected').addEventListener('click', () => startEditing(goal));
    $('#step-form').addEventListener('submit', addStep);
    elements.detailContent.querySelectorAll('[data-toggle-step]').forEach((checkbox) => checkbox.addEventListener('change', () => toggleStep(checkbox.dataset.toggleStep)));
    elements.detailContent.querySelectorAll('[data-delete-step]').forEach((button) => button.addEventListener('click', () => deleteStep(button.dataset.deleteStep)));
  }

  function stepMarkup(step) {
    const completed = step.status === 'completed';
    return `<label class="step-row ${completed ? 'is-done' : ''}"><input type="checkbox" data-toggle-step="${escapeHtml(step.id)}" ${completed ? 'checked' : ''}><span>${escapeHtml(step.title)}</span><button type="button" class="step-delete" data-delete-step="${escapeHtml(step.id)}" aria-label="Xóa mục tiêu nhỏ">×</button></label>`;
  }

  function selectGoal(id) {
    selectedGoalId = id;
    render();
    document.querySelector('#detail-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleGoalStatus(id) {
    const goal = state.goals.find((item) => item.id === id);
    if (!goal) return;
    goal.status = goal.status === 'completed' ? 'active' : 'completed';
    goal.updatedAt = new Date().toISOString();
    saveState();
    showToast(goal.status === 'completed' ? 'Đã đánh dấu mục tiêu hoàn thành.' : 'Đã mở lại mục tiêu.');
    render();
  }

  function addStep(event) {
    event.preventDefault();
    const goal = state.goals.find((item) => item.id === selectedGoalId);
    const input = $('#step-title');
    if (!goal || !input.value.trim()) return;
    goal.children.push({ id: createId(), title: input.value.trim(), status: 'active' });
    goal.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function toggleStep(stepId) {
    const goal = state.goals.find((item) => item.id === selectedGoalId);
    const step = goal?.children.find((item) => item.id === stepId);
    if (!step) return;
    step.status = step.status === 'completed' ? 'active' : 'completed';
    goal.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function deleteStep(stepId) {
    const goal = state.goals.find((item) => item.id === selectedGoalId);
    if (!goal || !confirm('Xóa mục tiêu nhỏ này?')) return;
    goal.children = goal.children.filter((step) => step.id !== stepId);
    goal.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function resetForm() {
    editingGoalId = null;
    elements.goalForm.reset();
    $('#form-title').textContent = 'Thêm mục tiêu mới';
    $('#cancel-edit').hidden = true;
    elements.type.value = 'short';
    elements.priority.value = 'medium';
  }

  function startEditing(goal) {
    editingGoalId = goal.id;
    elements.title.value = goal.title;
    elements.description.value = goal.description;
    elements.type.value = goal.type;
    elements.dueDate.value = goal.dueDate;
    elements.priority.value = goal.priority;
    $('#form-title').textContent = 'Chỉnh sửa mục tiêu';
    $('#cancel-edit').hidden = false;
    document.querySelector('#goal-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function submitGoal(event) {
    event.preventDefault();
    const values = {
      title: elements.title.value.trim(),
      description: elements.description.value.trim(),
      type: elements.type.value,
      dueDate: elements.dueDate.value,
      priority: elements.priority.value,
    };
    if (!values.title) return;
    if (editingGoalId) {
      const goal = state.goals.find((item) => item.id === editingGoalId);
      Object.assign(goal, values, { updatedAt: new Date().toISOString() });
      selectedGoalId = goal.id;
      showToast('Đã cập nhật mục tiêu.');
    } else {
      const goal = { id: createId(), ...values, status: 'active', children: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.goals.unshift(goal);
      selectedGoalId = goal.id;
      showToast('Đã thêm mục tiêu mới.');
    }
    saveState();
    resetForm();
    render();
  }

  async function exportData() {
    const filename = `muc-tieu-${new Date().toISOString().slice(0, 10)}.json`;
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
    const file = new File([payload], filename, { type: 'application/json' });

    // iPhone/iPad Safari works better with the native share sheet than with <a download>.
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Sao lưu mục tiêu cá nhân' });
        showToast('Đã mở bảng chia sẻ bản sao dữ liệu.');
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    showToast('Đã tạo file sao lưu dữ liệu.');
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const result = validateImport(parsed);
        if (!result.valid) throw new Error(result.reason);
        if (!confirm('Nhập dữ liệu sẽ thay thế danh sách hiện tại. Tiếp tục?')) return;
        state = normalizeState(parsed);
        selectedGoalId = null;
        saveState();
        render();
        showToast('Đã khôi phục dữ liệu.');
      } catch (error) {
        showToast(error.message || 'Không thể đọc tệp dữ liệu.', true);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function showToast(message, isError = false) {
    elements.toast.textContent = message;
    elements.toast.className = `toast show ${isError ? 'error' : ''}`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { elements.toast.className = 'toast'; }, 2800);
  }

  elements.goalForm.addEventListener('submit', submitGoal);
  $('#cancel-edit').addEventListener('click', resetForm);
  [elements.filterStatus, elements.filterType, elements.filterPriority].forEach((element) => element.addEventListener('change', renderGoals));
  elements.search.addEventListener('input', renderGoals);
  elements.exportData.addEventListener('click', exportData);
  elements.importData.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', importData);
  elements.clearData.addEventListener('click', () => {
    if (!state.goals.length || !confirm('Xóa toàn bộ mục tiêu trên máy này?')) return;
    state = { goals: [] };
    selectedGoalId = null;
    saveState();
    render();
    showToast('Đã xóa dữ liệu cục bộ.');
  });

  resetForm();
  render();
})();
