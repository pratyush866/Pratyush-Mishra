let currentFilter = 'all'; 
function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem('todos') || '[]');
  } catch (_) {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
  const todos = loadTodos();
  const list  = document.getElementById('task-list');

  const visible = todos.filter(t => {
    if (currentFilter === 'active')    return !t.completed;
    if (currentFilter === 'completed') return  t.completed;
    return true;
  });

  if (visible.length === 0) {
    const msg =
      currentFilter === 'completed' ? 'No completed tasks yet.' :
      currentFilter === 'active'    ? 'Nothing left to do! 🎉' :
                                      'Add your first task above!';
    list.innerHTML = `
      <li class="empty-state">
        <span class="icon">✅</span>${msg}
      </li>`;
  } else {
    list.innerHTML = visible.map(todo => `
      <li class="task-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <span class="task-text">${escapeHtml(todo.text)}</span>
        <div class="task-actions">
          <button class="task-btn btn-toggle" data-action="toggle"
            title="${todo.completed ? 'Mark active' : 'Mark complete'}">
            ${todo.completed ? '↩' : '✔'}
          </button>
          <button class="task-btn btn-edit"   data-action="edit"   title="Edit">✎</button>
          <button class="task-btn btn-delete" data-action="delete" title="Delete">🗑</button>
        </div>
      </li>
    `).join('');
  }
  const activeCount = todos.filter(t => !t.completed).length;
  document.getElementById('items-left').textContent =
    `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
}

function addTask() {
  const input = document.getElementById('new-task-input');
  const text  = input.value.trim();
  if (!text) return;

  const todos = loadTodos();
  todos.push({ id: Date.now(), text: text, completed: false });
  saveTodos(todos);

  input.value = '';
  input.focus();
  renderTodos();
}
function toggleComplete(id) {
  const todos = loadTodos().map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTodos(todos);
  renderTodos();
}

function editTask(id) {
  const todos = loadTodos();
  const todo  = todos.find(t => t.id === id);
  if (!todo) return;

  const li = document.querySelector(`.task-item[data-id="${id}"]`);
  if (!li) return;

  const textEl = li.querySelector('.task-text');
  const input  = document.createElement('input');
  input.className = 'task-edit-input';
  input.value     = todo.text;
  li.replaceChild(input, textEl);
  input.focus();
  input.select();

  const actions = li.querySelector('.task-actions');
  actions.innerHTML = `
    <button class="task-btn btn-toggle" data-action="save-edit"   title="Save (Enter)">✔</button>
    <button class="task-btn btn-delete" data-action="cancel-edit" title="Cancel (Esc)">✖</button>
  `;

  function saveEdit() {
    const newText = input.value.trim();
    if (!newText) { cancelEdit(); return; }
    const updated = loadTodos().map(t =>
      t.id === id ? { ...t, text: newText } : t
    );
    saveTodos(updated);
    renderTodos();
  }

  function cancelEdit() { renderTodos(); }
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveEdit();
    if (e.key === 'Escape') cancelEdit();
  });

  actions.querySelector('[data-action="save-edit"]').addEventListener('click', saveEdit);
  actions.querySelector('[data-action="cancel-edit"]').addEventListener('click', cancelEdit);
}

function deleteTask(id) {
  saveTodos(loadTodos().filter(t => t.id !== id));
  renderTodos();
}

function clearCompleted() {
  saveTodos(loadTodos().filter(t => !t.completed));
  renderTodos();
}

function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

document.getElementById('add-btn')
        .addEventListener('click', addTask);

document.getElementById('new-task-input')
        .addEventListener('keydown', e => {
          if (e.key === 'Enter') addTask();
        });

document.getElementById('filters')
        .addEventListener('click', e => {
          const btn = e.target.closest('.filter-btn');
          if (!btn) return;
          document.querySelectorAll('.filter-btn')
                  .forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.dataset.filter;
          renderTodos();
        });

document.getElementById('task-list')
        .addEventListener('click', e => {
          const btn = e.target.closest('[data-action]');
          if (!btn) return;
          const li = btn.closest('.task-item');
          if (!li) return;
          const id = Number(li.dataset.id);
          switch (btn.dataset.action) {
            case 'toggle': toggleComplete(id); break;
            case 'edit':   editTask(id);       break;
            case 'delete': deleteTask(id);     break;
          }
        });

document.getElementById('clear-completed')
        .addEventListener('click', clearCompleted);

renderTodos();