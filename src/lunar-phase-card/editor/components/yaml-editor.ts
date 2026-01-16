import { css, CSSResultGroup, html, LitElement, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { fireEvent } from '../../../ha';
import { BaseEditor } from '../base-editor';

declare global {
  interface HASSDomEvents {
    'yaml-value-changed': { value: any };
    'yaml-editor-closed': undefined;
  }
}

const YAML_ACTION_STYLE = css`
  .card-actions {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
  }
`.toString();

@customElement('lpc-yaml-editor')
export class YamlEditor extends BaseEditor {
  @property({ attribute: false }) public configDefault: any;
  @property({ type: Boolean, attribute: 'has-extra-actions' }) public hasExtraActions = false;
  @property() _yamlChanged!: (ev: CustomEvent) => void;

  @query('ha-yaml-editor', true) private _yamlEditor?: LitElement;

  protected render(): TemplateResult | typeof nothing {
    if (!this._hass) {
      return nothing;
    }
    return html`
      <ha-yaml-editor
        .hass=${this._hass}
        .defaultValue=${this.configDefault}
        .hasExtraActions=${this.hasExtraActions}
        @value-changed=${this._yamlChanged || this._onYamlChanged}
      ></ha-yaml-editor>
      ${this.hasExtraActions
        ? html`<ha-button
            size="medium"
            variant="warning"
            appearance="plain"
            slot="extra-actions"
            @click=${this._closeEditor}
          >
            Close Editor
          </ha-button>`
        : nothing}
    `;
  }

  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    await this.updateComplete;
    this._changeStyles();
  }

  private _changeStyles(): void {
    if (this._yamlEditor?.shadowRoot) {
      this._stylesManager.addStyle([YAML_ACTION_STYLE], this._yamlEditor.shadowRoot);
    }
  }

  private _onYamlChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const { isValid, value } = ev.detail;
    if (isValid) {
      fireEvent(this, 'yaml-value-changed', { value });
    }
  }

  private _closeEditor(): void {
    fireEvent(this, 'yaml-editor-closed', undefined);
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        --code-mirror-max-height: 400px;
      }
      ha-yaml-editor div.card-actions {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
    `;
  }
}
