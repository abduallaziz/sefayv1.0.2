@AGENTS.md

## Standing UI conventions (do not violate)

- **Never use native `<input type="date">` / `<input type="month">`** for date or date-range selection. Always use the project's own `DateRangePicker` or `SingleDatePicker` components from `src/shared/ui/date-range-picker`. This is a permanent rule the user set explicitly, not a one-off preference — review it before starting any task involving date selection.
- **Always render numbers with English (Western, 0-9) numerals** in every field and display, in every locale — never Arabic-Indic numerals.
