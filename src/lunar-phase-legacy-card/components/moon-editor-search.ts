import { mdiClose } from '@mdi/js';
import { LitElement, TemplateResult, CSSResultGroup, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { SearchResults } from '../../types/config/lunar-phase-card-config';
import { getCoordinates } from '../../utils/helpers';
// styles
import editorStyles from '../css/editor.css';
import { LunarPhaseCardEditor } from '../editor';

const ALERT_DURATION = 5 * 1000; // 5 seconds

@customElement('moon-editor-search')
export class MoonEditorSearch extends LitElement {
  @property({ attribute: false }) _editor!: LunarPhaseCardEditor;
  @state() _searchValue: string = '';
  @state() _searchResults: SearchResults[] = [];
  private _debounceTimer: number | null = null;

  static get styles(): CSSResultGroup {
    return [editorStyles];
  }

  render(): TemplateResult {
    const searchInput = html`
      <ha-textfield
        .autofocus=${this.autofocus}
        .aria-label=${'Search'}
        .placeholder=${'Search for a location, e.g. "London, UK"'}
        .value=${this._searchValue || ''}
        @keyup=${(ev: Event) => this._handleSearchInput(ev)}
      >
      </ha-textfield>
      ${this._searchValue !== ''
        ? html`<ha-icon-button .path=${mdiClose} @click=${this._clearSearch}></ha-icon-button>`
        : nothing}
    `;

    const infoSuccess = html` <ha-alert
      alert-type="success"
      id="success-alert"
      style="display: none;"
      title="Location change"
    >
      Search results found
    </ha-alert>`;

    return html` <div class="card-config">
      <div class="search-form">${searchInput}</div>
      ${infoSuccess} ${this._renderSearchResults()}
    </div>`;
  }

  private _renderSearchResults(): TemplateResult | typeof nothing {
    if (this._searchResults.length === 0) {
      return nothing;
    }
    const results = this._searchResults.map((result) => {
      return html`<li class="search-item" @click=${() => this._handleSearchResult(result)}>
        ${result.display_name}
      </li> `;
    });

    return html` <ul class="search-results">
      ${results}
    </ul>`;
  }

  private _handleSearchResult(result: SearchResults): void {
    console.log('search result', result);
    const { lat: latitude, lon: longitude } = result;

    const event = new CustomEvent('location-update', {
      detail: {
        latitude,
        longitude,
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(event);
    this._clearSearch();
    const message = `${name} [${latitude}, ${longitude}]`;
    this._setSettingsAlert(message);
  }

  private _setSettingsAlert(message: string, error: boolean = false): void {
    const alert = this.shadowRoot?.getElementById('success-alert') as Element;
    if (alert) {
      alert.innerHTML = message;
      alert.setAttribute('alert-type', error ? 'error' : 'info');
      alert.setAttribute('style', 'display: block;');
      alert.setAttribute('title', error ? '' : 'Location change');
      setTimeout(() => {
        alert.setAttribute('style', 'display: none;');
      }, ALERT_DURATION);
    }
  }

  private _handleSearchInput(ev: Event): void {
    ev.stopPropagation();
    const target = ev.target as HTMLInputElement;
    this._searchValue = target.value;

    // Clear any previous timer
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    // Set a new timer to trigger search after 300ms of inactivity
    this._debounceTimer = window.setTimeout(() => {
      this._refreshSearchResults(this._searchValue);
    }, 700);
  }

  private async _refreshSearchResults(searchValue: string): Promise<void> {
    const searchValueTrimmed = searchValue.trim();
    if (searchValueTrimmed.length < 2) {
      return;
    }

    const searchResults = await getCoordinates(searchValueTrimmed);

    if (searchResults) {
      this._searchResults = searchResults as SearchResults[];
    }
  }

  private _clearSearch(): void {
    console.log('clear search');
    this._searchValue = '';
    this._searchResults = [];
  }
}
