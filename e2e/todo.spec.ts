import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Seed localStorage with an empty array and reload.
 * Cannot use clear() because an empty localStorage triggers the service's
 * demo-data fallback.
 */
async function clearStorage(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('ng-todos', '[]'));
  await page.reload();
  await expect(page.locator('.todo-list')).toHaveCount(0);
}

/** Open the "New Task" form if it isn't already open. */
async function openForm(page: Page) {
  const form = page.locator('#add-todo-form');
  const isOpen = await form.evaluate((el) => el.classList.contains('open'));
  if (!isOpen) await page.click('#add-todo-toggle');
  await expect(form).toBeVisible();
}

/** Add a todo via the form and wait for it to appear in the list. */
async function addTodo(
  page: Page,
  title: string,
  opts: { description?: string; priority?: 'low' | 'medium' | 'high' } = {},
) {
  await openForm(page);
  await page.fill('#todo-title', title);
  if (opts.description) await page.fill('#todo-desc', opts.description);
  if (opts.priority)    await page.selectOption('#todo-priority', opts.priority);
  await page.click('#add-todo-submit');
  await expect(getTodoItem(page, title)).toBeVisible();
}

/**
 * Locate the <article> card for a given title.
 * NOTE: only valid in *view mode*. In edit mode the <h3> is hidden so
 * `hasText` won't match — use `getEditingItem()` instead.
 */
function getTodoItem(page: Page, title: string) {
  return page.locator('article.todo-item', { hasText: title });
}

/**
 * Return the article currently in edit mode.
 * Angular adds the `editing` class when `isEditing` is true.
 */
function getEditingItem(page: Page) {
  return page.locator('article.todo-item.editing');
}

/**
 * Toggle a todo by clicking its visible label.
 * The actual checkbox is visually-hidden; the label is the click target.
 */
async function toggleTodo(page: Page, title: string) {
  const item = getTodoItem(page, title);
  await item.locator('label.checkbox-wrap').click();
}

/**
 * Click an action button (edit / delete) inside a todo card.
 *
 * The `.item-actions` container has `opacity: 0` by default and becomes
 * visible on `:hover` via CSS. We bypass this by invoking `element.click()`
 * directly in the page context — Angular's (click) binding still fires.
 *
 * Returns the item locator (valid only in view mode).
 */
async function clickViewAction(page: Page, title: string, selector: string) {
  const item = getTodoItem(page, title);
  await item.evaluate((el, sel) => {
    (el.querySelector(sel) as HTMLElement)?.click();
  }, selector);
  return item;
}

/**
 * Open the edit form for a todo.
 * After clicking .edit-btn, Angular swaps view-mode DOM for edit-mode DOM
 * (the <h3> title disappears), so we must switch to the `.editing` locator.
 * Returns the article in editing state.
 */
async function openEditForm(page: Page, title: string) {
  await clickViewAction(page, title, '.edit-btn');
  const editingItem = getEditingItem(page);
  await expect(editingItem).toBeVisible();
  return editingItem;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Todo App – E2E', () => {

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  // ── Add ──────────────────────────────────────────────────────────────────

  test.describe('Add todo', () => {

    test('adds a task with only a title', async ({ page }) => {
      await addTodo(page, 'Buy groceries');
      await expect(getTodoItem(page, 'Buy groceries')).toBeVisible();
    });

    test('adds a task with title, description, and high priority', async ({ page }) => {
      await addTodo(page, 'Fix critical bug', {
        description: 'Reproduce on staging first',
        priority: 'high',
      });
      const item = getTodoItem(page, 'Fix critical bug');
      await expect(item.locator('.item-desc')).toHaveText('Reproduce on staging first');
      await expect(item.locator('.priority-badge')).toHaveText('High');
    });

    test('shows validation error when title is empty', async ({ page }) => {
      await openForm(page);
      await page.click('#todo-title');
      await page.click('#add-todo-submit');
      await expect(page.locator('.error[role="alert"]')).toContainText('Title is required');
    });

    test('shows validation error for a title that is too short', async ({ page }) => {
      await openForm(page);
      await page.fill('#todo-title', 'X');
      await page.click('#add-todo-submit');
      await expect(page.locator('.error[role="alert"]')).toContainText('At least 2 characters');
    });

    test('form collapses after successful submission', async ({ page }) => {
      await addTodo(page, 'Collapse test task');
      await expect(page.locator('#add-todo-form')).not.toHaveClass(/open/);
    });

    test('header total count increments', async ({ page }) => {
      const total = page.locator('.stat-num').nth(1); // stat: remaining | total
      await expect(total).toHaveText('0');

      await addTodo(page, 'Task one');
      await expect(total).toHaveText('1');

      await addTodo(page, 'Task two');
      await expect(total).toHaveText('2');
    });

  });

  // ── Edit ─────────────────────────────────────────────────────────────────

  test.describe('Edit todo', () => {

    test('opens edit form on edit button click', async ({ page }) => {
      await addTodo(page, 'Original title');
      const editingItem = await openEditForm(page, 'Original title');
      await expect(editingItem.locator('form[aria-label="Edit task form"]')).toBeVisible();
    });

    test('saves updated title', async ({ page }) => {
      await addTodo(page, 'Old title');
      const editingItem = await openEditForm(page, 'Old title');

      // id is dynamic (contains todo uuid) — match by prefix
      const titleInput = editingItem.locator('[id^="edit-title-"]');
      await titleInput.clear();
      await titleInput.fill('New shiny title');
      await editingItem.locator('.edit-actions button[type="submit"]').click();

      await expect(getTodoItem(page, 'New shiny title')).toBeVisible();
      await expect(
        page.locator('.todo-list').getByRole('heading', { name: 'Old title' }),
      ).toHaveCount(0);
    });

    test('saves updated description', async ({ page }) => {
      await addTodo(page, 'Task with desc', { description: 'Original desc' });
      const editingItem = await openEditForm(page, 'Task with desc');

      const descInput = editingItem.locator('[id^="edit-desc-"]');
      await descInput.clear();
      await descInput.fill('Updated description');
      await editingItem.locator('.edit-actions button[type="submit"]').click();

      // Back in view mode — find item by title again
      await expect(
        getTodoItem(page, 'Task with desc').locator('.item-desc'),
      ).toHaveText('Updated description');
    });

    test('saves updated priority', async ({ page }) => {
      await addTodo(page, 'Priority task', { priority: 'low' });
      const editingItem = await openEditForm(page, 'Priority task');

      await editingItem.locator('[id^="edit-priority-"]').selectOption('high');
      await editingItem.locator('.edit-actions button[type="submit"]').click();

      await expect(
        getTodoItem(page, 'Priority task').locator('.priority-badge'),
      ).toHaveText('High');
    });

    test('cancel edit restores view mode without changes', async ({ page }) => {
      await addTodo(page, 'Unchanged task');
      const editingItem = await openEditForm(page, 'Unchanged task');

      const titleInput = editingItem.locator('[id^="edit-title-"]');
      await titleInput.clear();
      await titleInput.fill('Temporary edit');
      await editingItem.locator('.edit-actions .btn-ghost-sm').click();

      // Back in view mode
      await expect(getTodoItem(page, 'Unchanged task').locator('.item-title'))
        .toHaveText('Unchanged task');
      await expect(getEditingItem(page)).toHaveCount(0);
    });

    test('shows validation error in edit form for short title', async ({ page }) => {
      await addTodo(page, 'Valid task');
      const editingItem = await openEditForm(page, 'Valid task');

      const titleInput = editingItem.locator('[id^="edit-title-"]');
      await titleInput.clear();
      await titleInput.fill('X');
      await editingItem.locator('.edit-actions button[type="submit"]').click();

      await expect(editingItem.locator('.error[role="alert"]')).toBeVisible();
    });

  });

  // ── Delete ────────────────────────────────────────────────────────────────

  test.describe('Delete todo', () => {

    test('shows confirmation dialog on delete click', async ({ page }) => {
      await addTodo(page, 'Task to maybe delete');
      const item = await clickViewAction(page, 'Task to maybe delete', '.delete-btn');
      await expect(item.locator('[role="alertdialog"]')).toBeVisible();
      await expect(item.locator('.btn-danger-sm')).toHaveText('Yes');
    });

    test('removes task after confirming delete', async ({ page }) => {
      await addTodo(page, 'Task to delete');
      const item = await clickViewAction(page, 'Task to delete', '.delete-btn');
      // Confirm quickly — askDelete() auto-resets after 3s
      await item.locator('.btn-danger-sm').click();
      await expect(
        page.locator('.todo-list').getByRole('heading', { name: 'Task to delete' }),
      ).toHaveCount(0);
    });

    test('cancels deletion when "No" is clicked', async ({ page }) => {
      await addTodo(page, 'Do not delete me');
      const item = await clickViewAction(page, 'Do not delete me', '.delete-btn');
      await item.locator('.btn-ghost-sm').click(); // "No"

      await expect(item.locator('[role="alertdialog"]')).not.toBeVisible();
      await expect(item).toBeVisible();
    });

    test('header counts update after deletion', async ({ page }) => {
      await addTodo(page, 'Count task');
      const total = page.locator('.stat-num').nth(1);
      await expect(total).toHaveText('1');

      const item = await clickViewAction(page, 'Count task', '.delete-btn');
      await item.locator('.btn-danger-sm').click();
      await expect(total).toHaveText('0');
    });

  });

  // ── Toggle completion ─────────────────────────────────────────────────────

  test.describe('Toggle completion', () => {

    test('marks a task as complete', async ({ page }) => {
      await addTodo(page, 'Complete me');
      await toggleTodo(page, 'Complete me');
      await expect(getTodoItem(page, 'Complete me')).toHaveClass(/completed/);
    });

    test('active count decrements when task is completed', async ({ page }) => {
      await addTodo(page, 'Active task');
      const remaining = page.locator('.stat-num').nth(0);
      await expect(remaining).toHaveText('1');

      await toggleTodo(page, 'Active task');
      await expect(remaining).toHaveText('0');
    });

  });

  // ── Filters ───────────────────────────────────────────────────────────────
  // Filters are role="tab" buttons with static ids: filter-all, filter-active, filter-completed

  test.describe('Filters', () => {

    test('active filter hides completed tasks', async ({ page }) => {
      await addTodo(page, 'Active task');
      await addTodo(page, 'Done task');
      await toggleTodo(page, 'Done task');

      await page.click('#filter-active');

      await expect(getTodoItem(page, 'Active task')).toBeVisible();
      await expect(
        page.locator('.todo-list').getByRole('heading', { name: 'Done task' }),
      ).toHaveCount(0);
    });

    test('completed filter shows only completed tasks', async ({ page }) => {
      await addTodo(page, 'Pending task');
      await addTodo(page, 'Finished task');
      await toggleTodo(page, 'Finished task');

      await page.click('#filter-completed');

      await expect(getTodoItem(page, 'Finished task')).toBeVisible();
      await expect(
        page.locator('.todo-list').getByRole('heading', { name: 'Pending task' }),
      ).toHaveCount(0);
    });

    test('all filter shows all tasks', async ({ page }) => {
      await addTodo(page, 'Task A');
      await addTodo(page, 'Task B');
      await toggleTodo(page, 'Task B');

      await page.click('#filter-completed');
      await page.click('#filter-all');

      await expect(getTodoItem(page, 'Task A')).toBeVisible();
      await expect(getTodoItem(page, 'Task B')).toBeVisible();
    });

  });

});
