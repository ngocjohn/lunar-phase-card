import { mdiClose, mdiMagnify } from '@mdi/js';
import { LitElement, TemplateResult, CSSResultGroup, html, nothing, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { SearchResults } from '../types';
import { getCoordinates } from '../utils/helpers';

// styles
import editorStyles from '../css/editor.css';
import { LunarPhaseCardEditor } from '../editor';

const ALERT_DURATION = 5 * 1000; // 5 seconds

@customElement('moon-editor-search')
export class MoonEditorSearch extends LitElement {
  @property({ attribute: false }) _editor!: LunarPhaseCardEditor;
  @state() _searchValue: string = '';
  @state() _searchResults: SearchResults[] = [];
  @state() _searchResultsVisible = false;
  @state() _toastDissmissed = false;

  static get styles(): CSSResultGroup {
    return [editorStyles];
  }

  render(): TemplateResult {
    const searchInput = html`
      <ha-textfield
        .autofocus=${this.autofocus}
        .aria-label=${'Search'}
        .placeholder=${'Enter a location'}
        .value=${this._searchValue || ''}
        @input=${(ev: Event) => this._handleSearchInput(ev)}
        @blur=${() => this._searchLocation()}
      >
      </ha-textfield>
      ${this._searchResultsVisible
        ? html`<ha-icon-button .path=${mdiClose} @click=${this._clearSearch}></ha-icon-button>`
        : html`<ha-icon-button .path=${mdiMagnify} @click=${this._searchLocation}></ha-icon-button>`}
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

  private _handleAlertDismiss(ev: Event): void {
    const alert = ev.target as HTMLElement;
    alert.style.display = 'none';
    this._toastDissmissed = true;
  }

  private _renderSearchResults(): TemplateResult | typeof nothing {
    if (!this._searchResultsVisible || this._searchResults.length === 0) {
      return html`${!this._toastDissmissed
        ? html` <ha-alert
            alert-type="info"
            dismissable
            @alert-dismissed-clicked=${(ev: Event) => this._handleAlertDismiss(ev)}
          >
            You can get the latitude and longitude from the search with query like "London, UK".</ha-alert
          >`
        : nothing}`;
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
    const { lat, lon, display_name } = result;
    const event = new CustomEvent('location-update', {
      detail: {
        latitude: lat,
        longitude: lon,
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(event);
    this._clearSearch();
    const message = `${display_name} [${lat}, ${lon}]`;
    this._handleSettingsSuccess(message);
  }

  private _handleSettingsSuccess(message: string): void {
    const alert = this.shadowRoot?.getElementById('success-alert') as HTMLElement;
    if (alert) {
      alert.innerHTML = message;
      alert.style.display = 'block';
      setTimeout(() => {
        alert.style.display = 'none';
      }, ALERT_DURATION);
    }
  }

  private _handleSearchInput(ev: Event): void {
    ev.stopPropagation();
    const target = ev.target as HTMLInputElement;
    this._searchValue = target.value;
  }

  private _clearSearch(): void {
    console.log('clear search');
    this._searchValue = '';
    this._searchResults = [];
    this._searchResultsVisible = false;
  }

  private async _searchLocation(): Promise<void> {
    console.log('search location', this._searchValue);
    const searchValue = this._searchValue;
    if (!searchValue || searchValue === '') {
      return;
    }
    this._toastDissmissed = true;
    const results = await getCoordinates(searchValue);
    if (results) {
      this._searchResults = results;
      this._searchResultsVisible = true;
    }
  }
}
