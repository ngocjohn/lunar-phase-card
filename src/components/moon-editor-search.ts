import { mdiClose, mdiMagnify } from '@mdi/js';
import { LitElement, TemplateResult, CSSResultGroup, html, nothing, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { SearchResults } from '../types';
import { getCoordinates } from '../utils/helpers';
import { testResults } from '../utils/test';

// styles
import editorStyles from '../css/editor.css';
import { LunarPhaseCardEditor } from '../editor';

@customElement('moon-editor-search')
export class MoonEditorSearch extends LitElement {
  @property({ attribute: false }) _editor!: LunarPhaseCardEditor;
  @state() _searchValue: string = '';
  @state() _searchResults: SearchResults[] = [];
  @state() _searchResultsVisible = false;

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
      >
      </ha-textfield>
      ${this._searchResultsVisible
        ? html`<ha-icon-button .path=${mdiClose} @click=${this._clearSearch}></ha-icon-button>`
        : html`<ha-icon-button .path=${mdiMagnify} @click=${this._searchLocation}></ha-icon-button>`}
    `;

    return html`<div class="search-form">${searchInput}</div>
      ${this._renderSearchResults()} `;
  }

  private _renderSearchResults(): TemplateResult | typeof nothing {
    if (!this._searchResultsVisible || this._searchResults.length === 0) {
      return nothing;
    }
    const results = this._searchResults.map((result) => {
      return html`<li class="search-item" @click=${() => this._handleSearchResult(result)}>
        ${result.display_name}
      </li> `;
    });

    return html`<ul class="search-results">
      ${results}
    </ul>`;
  }

  private _handleSearchResult(result: SearchResults): void {
    console.log('search result', result);
    const { lat, lon } = result;
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
  }

  private _handleSearchInput(ev: Event): void {
    ev.stopPropagation();
    const target = ev.target as HTMLInputElement;
    console.log('search input', target.value);
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
    const results = await getCoordinates(searchValue);
    if (results) {
      this._searchResults = results;
      this._searchResultsVisible = true;
    }
  }
}
