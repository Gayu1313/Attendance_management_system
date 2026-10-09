const recordsBody = document.querySelector('#records-body');
const recordDialog = document.querySelector('#record-dialog');
const recordForm = document.querySelector('#record-form');
const deleteDialog = document.querySelector('#delete-dialog');
const errorMessage = document.querySelector('#error-message');
const formError = document.querySelector('#form-error');

let records = [];
let pendingDeleteId = null;

const today = new Date();
const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
document.querySelector('#today-label').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
}).format(today);

function getFilteredRecords() {
  const search = document.querySelector('#search-input').value.trim().toLocaleLowerCase();
  const status = document.querySelector('#status-filter').value.toLocaleLowerCase();
  const date = document.querySelector('#date-filter').value;

  return records.filter((record) => {
    const matchesSearch = `${record.employeeName} ${record.department}`.toLocaleLowerCase().includes(search);
    const matchesStatus = !status || record.status.toLocaleLowerCase() === status;
    const matchesDate = !date || record.attendanceDate === date;
    return matchesSearch && matchesStatus && matchesDate;
  });
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
}

function formatTime(value) {
  if (!value) return '—';
  const [hour, minute] = value.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hour, minute));
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('');
}

function createCell(text, className = '') {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderSummary() {
  const todaysRecords = records.filter((record) => record.attendanceDate === localToday);
  const countStatus = (status) => todaysRecords.filter((record) => record.status.toLocaleLowerCase() === status).length;
  document.querySelector('#stat-total').textContent = todaysRecords.length;
  document.querySelector('#stat-present').textContent = countStatus('present');
  document.querySelector('#stat-late').textContent = countStatus('late');
  document.querySelector('#stat-away').textContent = countStatus('absent') + countStatus('leave');
}

function renderRecords() {
  const visibleRecords = getFilteredRecords();
  recordsBody.replaceChildren();
  document.querySelector('#record-count').textContent = `${visibleRecords.length} ${visibleRecords.length === 1 ? 'record' : 'records'}${visibleRecords.length !== records.length ? ` · ${records.length} total` : ''}`;

  for (const record of visibleRecords) {
    const row = document.createElement('tr');
    const employeeCell = document.createElement('td');
    const employee = document.createElement('div');
    const avatar = document.createElement('span');
    const details = document.createElement('span');
    const name = document.createElement('span');
    const id = document.createElement('span');
    const status = document.createElement('span');

    employee.className = 'employee-cell';
    avatar.className = `avatar tone-${Math.abs(Number(record.id) || 0) % 4}`;
    avatar.textContent = initials(record.employeeName);
    avatar.setAttribute('aria-hidden', 'true');
    details.className = 'employee-details';
    name.className = 'employee-name';
    name.textContent = record.employeeName;
    id.className = 'employee-id';
    id.textContent = `Record #${record.id}`;
    details.append(name, id);
    employee.append(avatar, details);
    employeeCell.append(employee);
    row.append(employeeCell);
    row.append(createCell(record.department, 'department-name'));
    row.append(createCell(formatDate(record.attendanceDate)));
    row.append(createCell(formatTime(record.checkInTime)));
    row.append(createCell(formatTime(record.checkOutTime)));

    status.className = `status-badge status-${String(record.status).toLocaleLowerCase()}`;
    status.textContent = record.status;
    const statusCell = document.createElement('td');
    statusCell.append(status);
    row.append(statusCell);

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');
    actions.className = 'row-actions';
    editButton.className = 'row-action';
    editButton.type = 'button';
    editButton.textContent = '✎';
    editButton.title = `Edit ${record.employeeName}`;
    editButton.setAttribute('aria-label', `Edit ${record.employeeName}`);
    editButton.addEventListener('click', () => openRecordDialog(record));
    deleteButton.className = 'row-action delete';
    deleteButton.type = 'button';
    deleteButton.textContent = '×';
    deleteButton.title = `Delete ${record.employeeName}`;
    deleteButton.setAttribute('aria-label', `Delete ${record.employeeName}`);
    deleteButton.addEventListener('click', () => openDeleteDialog(record));
    actions.append(editButton, deleteButton);
    actionsCell.append(actions);
    row.append(actionsCell);
    recordsBody.append(row);
  }

  const isFiltered = Boolean(document.querySelector('#search-input').value || document.querySelector('#status-filter').value || document.querySelector('#date-filter').value);
  document.querySelector('#empty-state').hidden = visibleRecords.length > 0;
  document.querySelector('#empty-title').textContent = isFiltered ? 'No matching records' : 'No attendance records yet';
  document.querySelector('#empty-description').textContent = isFiltered ? 'Try changing or clearing your filters.' : 'Add a record to start tracking today’s attendance.';
  document.querySelector('#empty-add').hidden = isFiltered;
  document.querySelector('#empty-state').classList.toggle('filtered-empty', isFiltered);
  renderSummary();
}

async function loadRecords() {
  errorMessage.hidden = true;
  document.querySelector('#record-count').textContent = 'Loading records…';
  try {
    const response = await fetch('/attendance', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Could not load records (${response.status}).`);
    const data = await response.json();
    records = Array.isArray(data) ? data : [];
    renderRecords();
  } catch (error) {
    document.querySelector('#record-count').textContent = 'Records unavailable';
    errorMessage.textContent = `${error.message} Check that the server and database are running, then refresh.`;
    errorMessage.hidden = false;
    recordsBody.replaceChildren();
    document.querySelector('#empty-state').hidden = false;
    document.querySelector('#empty-title').textContent = 'Could not connect to attendance';
    document.querySelector('#empty-description').textContent = 'The attendance service did not respond.';
    document.querySelector('#empty-add').hidden = true;
  }
}

function openRecordDialog(record = null) {
  recordForm.reset();
  formError.hidden = true;
  document.querySelector('#record-id').value = record?.id ?? '';
  document.querySelector('#dialog-title').textContent = record ? 'Edit record' : 'Add record';
  document.querySelector('#save-record').textContent = record ? 'Save changes' : 'Save record';
  document.querySelector('#employee-name').value = record?.employeeName ?? '';
  document.querySelector('#department').value = record?.department ?? '';
  document.querySelector('#record-status').value = record?.status ?? 'Present';
  document.querySelector('#attendance-date').value = record?.attendanceDate ?? localToday;
  document.querySelector('#check-in').value = record?.checkInTime?.slice(0, 5) ?? '';
  document.querySelector('#check-out').value = record?.checkOutTime?.slice(0, 5) ?? '';
  recordDialog.showModal();
  document.querySelector('#employee-name').focus();
}

function openDeleteDialog(record) {
  pendingDeleteId = record.id;
  document.querySelector('#delete-title').textContent = `Delete ${record.employeeName}’s record?`;
  deleteDialog.showModal();
}

function getFormPayload() {
  const timeValue = (id) => document.querySelector(id).value;
  return {
    employeeName: timeValue('#employee-name').trim(),
    department: timeValue('#department').trim(),
    attendanceDate: timeValue('#attendance-date'),
    status: timeValue('#record-status'),
    checkInTime: timeValue('#check-in') ? `${timeValue('#check-in')}:00` : null,
    checkOutTime: timeValue('#check-out') ? `${timeValue('#check-out')}:00` : null
  };
}

recordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;
  const id = document.querySelector('#record-id').value;
  const button = document.querySelector('#save-record');
  button.disabled = true;
  button.textContent = 'Saving…';
  try {
    const response = await fetch(id ? `/attendance/${encodeURIComponent(id)}` : '/attendance', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(getFormPayload())
    });
    if (!response.ok) throw new Error(`Could not save record (${response.status}).`);
    recordDialog.close();
    await loadRecords();
  } catch (error) {
    formError.textContent = `${error.message} Please try again.`;
    formError.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = id ? 'Save changes' : 'Save record';
  }
});

document.querySelector('#confirm-delete').addEventListener('click', async () => {
  if (pendingDeleteId === null) return;
  const button = document.querySelector('#confirm-delete');
  button.disabled = true;
  button.textContent = 'Deleting…';
  try {
    const response = await fetch(`/attendance/${encodeURIComponent(pendingDeleteId)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Could not delete record (${response.status}).`);
    deleteDialog.close();
    pendingDeleteId = null;
    await loadRecords();
  } catch (error) {
    deleteDialog.close();
    errorMessage.textContent = `${error.message} Please refresh and try again.`;
    errorMessage.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = 'Delete record';
  }
});

document.querySelector('#add-record').addEventListener('click', () => openRecordDialog());
document.querySelector('#empty-add').addEventListener('click', () => openRecordDialog());
document.querySelector('#close-dialog').addEventListener('click', () => recordDialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => recordDialog.close());
document.querySelector('#cancel-delete').addEventListener('click', () => deleteDialog.close());
document.querySelector('#refresh-records').addEventListener('click', loadRecords);
document.querySelector('#search-input').addEventListener('input', renderRecords);
document.querySelector('#status-filter').addEventListener('change', renderRecords);
document.querySelector('#date-filter').addEventListener('change', renderRecords);

loadRecords();