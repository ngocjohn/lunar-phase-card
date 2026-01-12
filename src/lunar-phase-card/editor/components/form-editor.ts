import { capitalize } from 'es-toolkit';
import { css, CSSResultGroup, html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { HaFormElement } from '../../../ha/panels/ha-form/types';
import { BaseEditor } from '../base-editor';

const HA_FORM_STYLE = css`
  .root > :not([own-margin]):not(:last-child) {
    margin-bottom: 8px !important;
    margin-block-end: 8px !important;
  }
  .root ha-form-grid,
  .root ha-expansion-panel .root ha-form-grid {
    gap: 1em !important;
  }
  :host(.sectionOrder) .root ha-selector ha-selector-select {
    display: flex;
    flex-direction: column-reverse;
  }
`.toString();

@customElement('lpc-form-editor')
export class FormEditor extends BaseEditor {
  @property({ attribute: false }) data!: unknown;
  @property({ attribute: false }) schema!: unknown;
  @property() changed!: (ev: CustomEvent) => void;

  @query('#haForm') _haForm!: HaFormElement;

  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    await this.updateComplete;
    if (this._haForm.shadowRoot) {
      this._stylesManager.addStyle([HA_FORM_STYLE], this._haForm.shadowRoot);
      // this._changeChips();
    }
    // this._addEventListeners();
  }

  protected render(): TemplateResult {
    return html`<ha-form
      id="haForm"
      .hass=${this._hass}
      .data=${this.data}
      .schema=${this.schema}
      .computeLabel=${this.computeLabel}
      .computeHelper=${this.computeHelper}
      @value-changed=${this.changed}
    ></ha-form>`;
  }

  private computeLabel = (schema: any): string | undefined => {
    if (schema.name === 'entity' && !schema.context?.group_entity) {
      return undefined;
    }
    const label = schema.label || schema.name || schema.title || '';
    return capitalize(label.replace(/_/g, ' '));
  };

  private computeHelper = (schema: any): string | TemplateResult | undefined => {
    return schema.helper || undefined;
  };

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        width: 100%;
        flex: 1 1 auto;
      }
      #haForm {
        display: flex;
        flex-direction: column;
        width: 100%;
        box-sizing: border-box;
        /* margin-block-end: 8px; */
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lpc-form-editor': FormEditor;
  }
}
