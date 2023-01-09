import * as React from 'react';
import {Button} from '@twilio-paste/button';
import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {DataGridCell, DataGridHeaderSort, DataGridHeader} from '../src';
import {
  ColumnSpanDataGrid,
  ComposableCellsDataGrid,
  SortableColumnsDataGrid,
  PaginatedDataGrid,
  PlainDataGrid,
} from '../stories/index.stories';

const checkTagName = (el: Element, name: string): void => expect(el.tagName).toBe(name.toUpperCase());

describe('Data Grid', () => {
  describe('Semantics', () => {
    // eslint-disable-next-line jest/expect-expect
    it('uses table elements in the DOM', () => {
      const {getByTestId} = render(<PlainDataGrid />);
      const dataGrid = getByTestId('data-grid');
      checkTagName(dataGrid, 'table');

      const thead = dataGrid.children[0];
      const theadTr = thead.children[0];
      const theadTrTh = theadTr.children[0];
      checkTagName(thead, 'thead');
      checkTagName(theadTr, 'tr');
      checkTagName(theadTrTh, 'th');

      const tbody = dataGrid.children[1];
      const tbodyTr = tbody.children[0];
      const tbodyTrTd = tbodyTr.children[0];
      checkTagName(tbody, 'tbody');
      checkTagName(tbodyTr, 'tr');
      checkTagName(tbodyTrTd, 'td');
    });

    it('has the correct aria label and role', () => {
      const {getByTestId} = render(<PlainDataGrid />);
      const dataGrid = getByTestId('data-grid');
      expect(dataGrid.getAttribute('aria-label')).toBeDefined();
      expect(dataGrid.getAttribute('role')).toBe('grid');
    });
  });

  describe('Column Span', () => {
    it('applies colSpan attribute as expected', () => {
      const {getByTestId} = render(<ColumnSpanDataGrid />);
      const th = getByTestId('data-grid-header');
      expect(th).toHaveAttribute('colspan', '5');
    });
  });

  describe('Composable Cells functionality', () => {
    it('has proper keyboard navigation behavior', async () => {
      const {getByTestId} = render(<ComposableCellsDataGrid />);
      const wrapper = getByTestId('data-grid');
      const headerCell = getByTestId('header-1');
      const firstRowFirstInputCell = getByTestId('input-0-0');
      const firstRowSecondInputCell = getByTestId('input-0-1');
      const secondRowFirstInputCell = getByTestId('input-1-0');
      const firstInputCell = firstRowFirstInputCell?.parentElement?.parentElement;

      if (firstInputCell == null) {
        throw new Error('cannot find firstInputCell');
      }

      // TEST: moves with arrow keys in navigational mode
      act(() => {
        headerCell.focus();
      });

      await userEvent.keyboard('{arrowright}');
      expect(document.activeElement?.innerHTML).toBe('Last Name');

      await userEvent.keyboard('{arrowleft}');
      expect(headerCell).toHaveFocus();

      await userEvent.keyboard('{arrowdown}');
      expect(headerCell.getAttribute('tabindex')).toBe('-1');
      expect(firstInputCell).toHaveFocus();
      expect(firstInputCell.getAttribute('tabindex')).toBe('0');

      await userEvent.keyboard('{arrowup}');
      expect(firstInputCell.getAttribute('tabindex')).toBe('-1');
      expect(headerCell.getAttribute('tabindex')).toBe('0');
      expect(headerCell).toHaveFocus();

      // TEST: toggles actionable mode with [enter] and [escape] keys
      act(() => {
        headerCell.focus();
      });
      expect(wrapper.getAttribute('data-actionable')).toBe('false');
      await userEvent.keyboard('{enter}');
      expect(wrapper.getAttribute('data-actionable')).toBe('true');
      await userEvent.keyboard('{esc}');
      expect(wrapper.getAttribute('data-actionable')).toBe('false');

      // TEST: should enable Actionable mode when clicking into the DataGrid
      expect(wrapper.getAttribute('data-actionable')).toBe('false');

      await userEvent.click(headerCell);
      expect(wrapper.getAttribute('data-actionable')).toBe('true');

      // TEST: should correctly tab through focusable elements in actionable mode
      act(() => {
        headerCell.focus();
      });

      // Down to input cell
      await userEvent.keyboard('{arrowdown}');
      // Swap to actionable
      await userEvent.keyboard('{enter}');

      expect(firstRowFirstInputCell).toHaveFocus();
      await userEvent.tab();
      expect(firstRowSecondInputCell).toHaveFocus();
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      expect(secondRowFirstInputCell).toHaveFocus();

      /*
       * TEST: handles entering actionable mode from a cell without focusable children correctly
       * I added this particular sequence because it was a reproducable bug in my manual tests
       */
      act(() => {
        headerCell.focus();
      });
      await userEvent.keyboard('{enter}');
      await userEvent.keyboard('{arrowdown}');
      expect(firstInputCell).toHaveFocus();
      await userEvent.keyboard('{enter}');
      await userEvent.tab();
      expect(firstRowSecondInputCell).toHaveFocus();
    }, 25000);

    it('has one tab stop in navigational mode and remembers the last focus', async () => {
      const {getByTestId} = render(
        <div>
          <Button variant="primary" data-testid="before">
            Before
          </Button>
          <ComposableCellsDataGrid />
          <Button variant="primary" data-testid="after">
            After
          </Button>
        </div>
      );

      const beforeDataGridButton = getByTestId('before');
      const headerCell = getByTestId('header-1');
      const firstInputCell = getByTestId('input-0-0')?.parentElement?.parentElement;
      const afterDataGridButton = getByTestId('after');

      if (firstInputCell == null) {
        throw new Error('cannot find firstInputCell');
      }

      // Focus the button before the DataGrid
      beforeDataGridButton.focus();
      expect(beforeDataGridButton).toHaveFocus();
      // Tab into the DataGrid
      await userEvent.tab();
      expect(headerCell).toHaveFocus();
      expect(headerCell.getAttribute('tabIndex')).toBe('0');
      // Down
      await userEvent.keyboard('{arrowdown}');
      expect(headerCell.getAttribute('tabindex')).toBe('-1');
      expect(firstInputCell).toHaveFocus();
      expect(firstInputCell.getAttribute('tabindex')).toBe('0');
      // Tab out of the DataGrid
      await userEvent.tab();
      expect(afterDataGridButton).toHaveFocus();
      // Return into the DataGrid
      await userEvent.tab({shift: true});
      expect(firstInputCell).toHaveFocus();
      expect(firstInputCell.getAttribute('tabindex')).toBe('0');
    });

    it('should change the focus correctly when swapping to and from actionable mode', async () => {
      const {getByTestId} = render(<ComposableCellsDataGrid />);
      const headerCell = getByTestId('header-1');
      const firstRowFirstInputCell = getByTestId('input-0-0');

      // Focus doesnt change when no focusable children
      act(() => {
        headerCell.focus();
      });
      await userEvent.keyboard('{enter}');
      expect(headerCell).toHaveFocus();

      // Down to input firstChild
      await userEvent.keyboard('{esc}');
      await userEvent.keyboard('{arrowdown}');
      await userEvent.keyboard('{enter}');
      expect(firstRowFirstInputCell).toHaveFocus();

      // Up back to cell
      await userEvent.keyboard('{esc}');
      expect(firstRowFirstInputCell?.parentElement?.parentElement).toHaveFocus();
    });
  });

  describe('Paginated data grid', () => {
    it('returns the first focused cell to the first cell in the datatable after pagination', async () => {
      const {getByTestId} = render(<PaginatedDataGrid />);
      const firstThCell = getByTestId('first-cell');
      const firstTdCell = getByTestId('cell-0-0');

      // I added this particular sequence because it was a reproducable bug in my manual tests
      act(() => {
        firstThCell.focus();
      });
      expect(firstThCell).toHaveFocus();

      await userEvent.keyboard('{arrowdown}');
      expect(firstTdCell).toHaveFocus();

      // Swap to page 2
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.keyboard('{enter}');
      // Bring the focus back to the DataGrid
      await userEvent.tab({shift: true});
      await userEvent.tab({shift: true});
      await userEvent.tab({shift: true}); // 3rd one because left arrow appears

      // The first cell is focused, rather than the last cell we were on
      expect(firstThCell).toHaveFocus();
    });
  });

  describe('Sorting', () => {
    it('should correctly set aria-sort on TH when sorting is enabled', () => {
      const {getByTestId} = render(<SortableColumnsDataGrid />);
      const header = getByTestId('header');
      const headerSort = getByTestId('header-sort');

      expect(header.getAttribute('aria-sort')).toBe('ascending');
      act(() => {
        headerSort.click();
      });
      expect(header.getAttribute('aria-sort')).toBe('descending');
      act(() => {
        headerSort.click();
      });
      expect(header.getAttribute('aria-sort')).toBe('ascending');
    });
  });
});

describe('i18n', () => {
  describe('DataGridHeaderSort', () => {
    it('should have default ascending label', () => {
      render(<DataGridHeaderSort direction="ascending" />);
      const button = screen.getByRole('button', {name: 'Sort ascending'});
      expect(button).toBeDefined();
    });

    it('should have default descending label', () => {
      render(<DataGridHeaderSort direction="descending" />);
      const button = screen.getByRole('button', {name: 'Sort descending'});
      expect(button).toBeDefined();
    });

    it('should have default unsorted label', () => {
      render(<DataGridHeaderSort direction="none" />);
      const button = screen.getByRole('button', {name: 'Unsorted'});
      expect(button).toBeDefined();
    });

    it('should use i18nAscendingLabel for the ascending label', () => {
      render(<DataGridHeaderSort direction="ascending" i18nAscendingLabel="Tri croissant" />);
      const button = screen.getByRole('button', {name: 'Tri croissant'});
      expect(button).toBeDefined();
    });

    it('should use i18nDescendingLabel for the descending label', () => {
      render(<DataGridHeaderSort direction="descending" i18nDescendingLabel="Tri décroissant" />);
      const button = screen.getByRole('button', {name: 'Tri décroissant'});
      expect(button).toBeDefined();
    });

    it('should use i18nUnsortedLabel for the unsorted label', () => {
      render(<DataGridHeaderSort direction="none" i18nUnsortedLabel="Non triés" />);
      const button = screen.getByRole('button', {name: 'Non triés'});
      expect(button).toBeDefined();
    });
  });
});
