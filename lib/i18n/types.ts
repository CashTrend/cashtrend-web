/**
 * i18n types — locale identifiers, the Translation shape, and a micro
 * interpolation helper for dynamic strings.
 *
 * The Translation interface is hand-authored to match en.json / es.json.
 * TypeScript will catch any key mismatches at compile time.
 */

export type Locale = 'en' | 'es'

/** A single glossary entry shown in a FieldTooltip panel. */
export interface GlossaryEntry {
  label: string
  summary: string
  detail: string
}

export interface Translation {
  ui: {
    app_name: string
    language_toggle_label: string
    theme_switch_light: string
    theme_switch_dark: string
    retry: string
    cancel: string
    no_data: string
    error_backend: string
  }
  nav: {
    dashboard: string
    portfolio: string
    tickers: string
    sign_out: string
    open_nav: string
    close_nav: string
    main_nav: string
    sidebar: string
    navigation: string
  }
  header: {
    page_dashboard: string
    page_portfolio: string
    page_new_transaction: string
    page_tickers: string
    page_edit_transaction: string
    page_ticker_detail: string
    fallback: string
    signed_in_as: string
  }
  dashboard: {
    loading: string
    portfolio_summary: string
    portfolio_value: string
    portfolio_value_desc: string
    total_invested: string
    total_invested_desc: string
    unrealised_pnl: string
    unrealised_pnl_desc: string
    open_positions: string
    holding_singular: string
    holding_plural: string
    error: string
  }
  portfolio: {
    page_title: string
    new_transaction: string
    transaction_singular: string
    transaction_plural: string
    shown_suffix: string
    delete_confirm_title: string
    delete_confirm_body: string
    delete_button: string
    error_load: string
    error_delete: string
    list: {
      empty_heading: string
      empty_subtext: string
      caption: string
      col_date: string
      col_type: string
      col_ticker: string
      col_qty: string
      col_price: string
      col_amount: string
      col_notes: string
      col_actions: string
      aria_edit: string
      aria_delete: string
    }
    form: {
      new_title: string
      edit_title: string
      submit_create: string
      submit_edit: string
      type_label: string
      type_aria: string
      type_buy: string
      type_sell: string
      type_income: string
      type_expense: string
      ticker_label: string
      quantity_label: string
      price_label: string
      amount_label: string
      date_label: string
      notes_label: string
      notes_placeholder: string
      number_placeholder: string
      cancel: string
      error_unexpected: string
      error_save: string
      error_create: string
      error_not_found: string
      error_invalid_id: string
      validation: {
        required: string
        positive: string
        ticker_required: string
      }
    }
  }
  tickers: {
    search_placeholder: string
    search_aria: string
    search_prompt: string
    search_min_chars: string
    search_error: string
    search_no_results: string
    autocomplete_label: string
    autocomplete_placeholder: string
    autocomplete_remove: string
    autocomplete_no_results: string
    error_load: string
    tabs: {
      ratios: string
      history: string
      income: string
      balance: string
      cashflow: string
      aria: string
    }
    ratios: {
      no_data: string
      section_valuation: string
      section_profitability: string
      section_cashflow: string
      section_dividends: string
      beta: string
      pe_trailing: string
      pe_forward: string
      eps_trailing: string
      eps_forward: string
      peg: string
      ps: string
      pb: string
      ev_revenue: string
      ev_ebitda: string
      gross_margin: string
      operating_margin: string
      ebitda_margin: string
      net_margin: string
      roa: string
      roe: string
      leverage: string
      op_cashflow: string
      free_cashflow: string
      dividend_yield: string
      dividend_date: string
      ex_dividend_date: string
    }
    history: {
      no_data: string
      error: string
      granularity_aria: string
      granularity_all: string
      show_label: string
      per_page: string
      entries_per_page_aria: string
      caption: string
      col_date: string
      col_open: string
      col_high: string
      col_low: string
      col_close: string
      col_dividend: string
      prev: string
      next: string
      page_info: string
      unit_days: string
      unit_weeks: string
      unit_months: string
      unit_years: string
      unit_entries: string
      chart_aria: string
    }
    income: {
      title: string
      no_data: string
      col_revenue: string
      col_gross_profit: string
      col_operating_profit: string
      col_ebit: string
      col_ebitda: string
      col_net_profit: string
    }
    balance: {
      title: string
      no_data: string
      col_current_assets: string
      col_noncurrent_assets: string
      col_current_liabilities: string
      col_noncurrent_liabilities: string
      col_equity: string
    }
    cashflow: {
      title: string
      no_data: string
      col_operating: string
      col_investing: string
      col_financing: string
    }
    financials: {
      col_year: string
      no_data: string
    }
  }
  glossary: {
    ratios: {
      beta: GlossaryEntry
      pe_trailing: GlossaryEntry
      pe_forward: GlossaryEntry
      eps_trailing: GlossaryEntry
      eps_forward: GlossaryEntry
      peg: GlossaryEntry
      ps: GlossaryEntry
      pb: GlossaryEntry
      ev_revenue: GlossaryEntry
      ev_ebitda: GlossaryEntry
      gross_margin: GlossaryEntry
      operating_margin: GlossaryEntry
      ebitda_margin: GlossaryEntry
      net_margin: GlossaryEntry
      roa: GlossaryEntry
      roe: GlossaryEntry
      leverage: GlossaryEntry
      op_cashflow: GlossaryEntry
      free_cashflow: GlossaryEntry
      dividend_yield: GlossaryEntry
      dividend_date: GlossaryEntry
      ex_dividend_date: GlossaryEntry
    }
    income: {
      revenue: GlossaryEntry
      gross_profit: GlossaryEntry
      operating_profit: GlossaryEntry
      ebit: GlossaryEntry
      ebitda: GlossaryEntry
      net_profit: GlossaryEntry
    }
    balance: {
      current_assets: GlossaryEntry
      noncurrent_assets: GlossaryEntry
      current_liabilities: GlossaryEntry
      noncurrent_liabilities: GlossaryEntry
      equity: GlossaryEntry
    }
    cashflow: {
      operating: GlossaryEntry
      investing: GlossaryEntry
      financing: GlossaryEntry
    }
  }
}

/**
 * Replace `{{key}}` placeholders in a template string with values from a record.
 *
 * @example
 * interpolate('Page {{page}} of {{total}}', { page: 3, total: 10 })
 * // → 'Page 3 of 10'
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''))
}
